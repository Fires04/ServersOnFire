import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Container,
  Group,
  Menu,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconApps,
  IconCheck,
  IconLayoutGrid,
  IconPalette,
  IconRefresh,
  IconSitemap,
  IconX,
} from '@tabler/icons-react'
import { api } from './lib/api'
import type { QuickLink, Server } from './types'
import { computeHostGroups, hostGroupColor } from './lib/hostGroups'
import { THEMES, THEME_NAMES, type ThemeName } from './lib/themes'
import FilterBar, { type KindFilter, type SortOption } from './components/FilterBar'
import ServerCard, { type GroupColor } from './components/ServerCard'
import ServerDetailModal from './components/ServerDetailModal'
import StatStrip, { type StatFilter } from './components/StatStrip'
import ServicesView from './components/ServicesView'
import HelpPanel from './components/HelpPanel'
import QuickLinksBar from './components/QuickLinksBar'

// Lazy: @xyflow/react is a sizeable dependency that only the topology view
// needs — no reason to ship it in the initial bundle for the (default)
// card-grid view.
const TopologyView = lazy(() => import('./components/topology/TopologyView'))

type ViewMode = 'cards' | 'topology' | 'services'
const VIEW_MODES: ViewMode[] = ['cards', 'topology', 'services']

// Filters and the current view live in the URL query string (?view=&q=&
// kind=&site=&sort=&stat=) so a link can be copied/bookmarked with its
// filter state intact — no client-side router needed for that, this is
// still a single page, just plain URLSearchParams read once on load and
// written back with history.replaceState (see the sync effect below).
function paramValue<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const value = new URLSearchParams(window.location.search).get(name)
  return (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback
}
function paramText(name: string): string {
  return new URLSearchParams(window.location.search).get(name) ?? ''
}

const SORT_OPTIONS: SortOption[] = ['name', 'status', 'services', 'vcpus', 'memory', 'disk']
const STAT_FILTERS: StatFilter[] = ['all', 'active', 'issues', 'servicesDown']
const KIND_FILTERS: KindFilter[] = ['all', 'device', 'vm']

export default function App({
  themeName,
  onThemeChange,
  onServerDefaultTheme,
}: {
  themeName: ThemeName
  onThemeChange: (name: ThemeName) => void
  onServerDefaultTheme: (name: string) => void
}) {
  const [servers, setServers] = useState<Server[] | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [displayTag, setDisplayTag] = useState('netmap')
  const [quicklinks, setQuicklinks] = useState<QuickLink[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState(() => paramText('q'))
  const [kind, setKind] = useState<KindFilter>(() => paramValue('kind', KIND_FILTERS, 'all'))
  const [site, setSite] = useState<string | null>(() => paramText('site') || null)
  const [sort, setSort] = useState<SortOption>(() => paramValue('sort', SORT_OPTIONS, 'name'))
  const [statFilter, setStatFilter] = useState<StatFilter>(() =>
    paramValue('stat', STAT_FILTERS, 'all'),
  )
  const [view, setView] = useState<ViewMode>(() => paramValue('view', VIEW_MODES, 'cards'))
  const [modalServer, setModalServer] = useState<Server | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 36em)') ?? false
  const searchRef = useRef<HTMLInputElement>(null)
  // Wraps the stat strip + filter bar + topology canvas together — the
  // Fullscreen API only affects the one element it's called on, and the
  // whole point of this button is that the filters stay usable while the
  // canvas fills the screen, so that element has to be a shared ancestor
  // of both rather than just the canvas.
  const fullscreenSectionRef = useRef<HTMLDivElement>(null)

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      fullscreenSectionRef.current?.requestFullscreen()
    }
  }

  // Stay in sync when fullscreen is exited some other way (Esc, browser
  // chrome) instead of via our own button.
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // Keep the URL in sync as filters/view change. replaceState (not push)
  // so typing a search doesn't spam the browser back-button history —
  // "shareable/bookmarkable URL" only needs the address bar to be current,
  // not a full undo stack.
  useEffect(() => {
    const params = new URLSearchParams()
    if (view !== 'cards') params.set('view', view)
    if (search) params.set('q', search)
    if (kind !== 'all') params.set('kind', kind)
    if (site) params.set('site', site)
    if (sort !== 'name') params.set('sort', sort)
    if (statFilter !== 'all') params.set('stat', statFilter)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }, [view, search, kind, site, sort, statFilter])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function load() {
    const res = await api.data()
    setServers(res.dataset?.servers ?? [])
    setGeneratedAt(res.dataset?.generated_at ?? null)
    setLastError(res.last_error)
    if (res.display_tag) setDisplayTag(res.display_tag)
    if (res.default_theme) onServerDefaultTheme(res.default_theme)
  }

  useEffect(() => {
    load()
    // Quicklinks rarely change and aren't part of the NetBox refresh cycle
    // — fetched once on load rather than wired into handleRefresh/load().
    api
      .quicklinks()
      .then(setQuicklinks)
      .catch(() => setQuicklinks([]))
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await api.refresh()
      setServers(res.dataset?.servers ?? [])
      setGeneratedAt(res.dataset?.generated_at ?? null)
      setLastError(res.last_error)
    } finally {
      setRefreshing(false)
    }
  }

  const hasActiveFilters =
    search !== '' || kind !== 'all' || site !== null || sort !== 'name' || statFilter !== 'all'

  // Wired to both the stat strip's "servers" tile and an explicit "Clear
  // filters" button — clicking either was the literal ask: "no way back to
  // seeing everything" once any of search/kind/site/sort/stat had narrowed
  // the view (each only cleared itself, not the others).
  function resetAllFilters() {
    setSearch('')
    setKind('all')
    setSite(null)
    setSort('name')
    setStatFilter('all')
  }

  const siteOptions = useMemo(() => {
    if (!servers) return []
    return Array.from(new Set(servers.map((s) => s.site_name).filter((s): s is string => !!s))).sort()
  }, [servers])

  const filtered = useMemo(() => {
    if (!servers) return []
    const needle = search.trim().toLowerCase()
    const result = servers.filter((s) => {
      if (kind !== 'all' && s.kind !== kind) return false
      if (site && s.site_name !== site) return false
      if (statFilter === 'active' && s.status !== 'active') return false
      if (statFilter === 'issues' && s.status === 'active') return false
      if (statFilter === 'servicesDown' && !s.services.some((svc) => svc.up === false)) return false
      if (!needle) return true
      // Searches into each server's own services and tags too — typing
      // "kasm" should surface the server that runs that service, not just
      // servers named/tagged "kasm".
      const haystack = [
        s.name,
        s.role,
        s.site_name,
        s.tenant_name,
        ...s.tags.map((t) => t.name),
        ...s.services.map((svc) => svc.name),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })

    // Sort on a copy — `result` is already a fresh array from .filter(), so
    // this doesn't mutate the source `servers` state.
    switch (sort) {
      case 'status':
        result.sort((a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name))
        break
      case 'services':
        result.sort((a, b) => b.services.length - a.services.length || a.name.localeCompare(b.name))
        break
      case 'vcpus':
        // Devices don't carry vcpus/memory_mb/disk_gb at all (only VMs
        // do, see dataset.py's _device_params vs _vm_params) — treated as
        // 0 here, which sorts them to the bottom rather than throwing off
        // comparisons with undefined.
        result.sort((a, b) => (b.params.vcpus ?? 0) - (a.params.vcpus ?? 0) || a.name.localeCompare(b.name))
        break
      case 'memory':
        result.sort(
          (a, b) => (b.params.memory_mb ?? 0) - (a.params.memory_mb ?? 0) || a.name.localeCompare(b.name),
        )
        break
      case 'disk':
        result.sort(
          (a, b) => (b.params.disk_gb ?? 0) - (a.params.disk_gb ?? 0) || a.name.localeCompare(b.name),
        )
        break
      default:
        result.sort((a, b) => a.name.localeCompare(b.name))
    }
    return result
  }, [servers, search, kind, site, sort, statFilter])

  // Host/VM grouping for the card view's colored edge (see ServerCard) —
  // computed from `filtered`, same as the topology view, so a host
  // filtered out of view stops coloring its (still visible) VMs rather
  // than implying a relationship you can't actually see the other end of.
  const hostGroups = useMemo(() => computeHostGroups(filtered), [filtered])
  function groupColorFor(server: Server): GroupColor | undefined {
    if (hostGroups.vmsByHost.has(server.name)) {
      return { color: hostGroupColor(server.name), role: 'host' }
    }
    const hostName = hostGroups.hostNameById.get(server.id)
    return hostName ? { color: hostGroupColor(hostName), role: 'guest' } : undefined
  }

  // "/" focuses search from anywhere on the page, "Esc" clears it — same
  // pair of shortcuts most search-heavy dashboards use, so it needs no
  // on-screen hint beyond the placeholder text.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape' && typing && search) {
        setSearch('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [search])

  return (
    <Container size="lg" py="lg">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="xs" align="center">
          <img src="/logo.png" alt="" height={38} style={{ objectFit: 'contain' }} />
          <div>
            <Title order={2} lh={1.1}>
              ServersOnFire
            </Title>
            <Text size="xs" c="dimmed" lh={1}>
              Inventory, Topology & Services
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          {generatedAt && !isMobile && (
            <Text size="xs" c="dimmed">
              Updated {new Date(generatedAt).toLocaleString()}
            </Text>
          )}
          <SegmentedControl
            size="sm"
            radius="xl"
            value={view}
            onChange={(value) => setView(value as ViewMode)}
            data={[
              {
                value: 'cards',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconLayoutGrid size={16} /> {!isMobile && <span>Cards</span>}
                  </Group>
                ),
              },
              {
                value: 'topology',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconSitemap size={16} /> {!isMobile && <span>Topology</span>}
                  </Group>
                ),
              },
              {
                value: 'services',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconApps size={16} /> {!isMobile && <span>Services</span>}
                  </Group>
                ),
              },
            ]}
          />
          <Menu shadow="md" width={160} position="bottom-end">
            <Menu.Target>
              <Tooltip label="Color theme">
                <ActionIcon variant="light" color="flame" size="lg" aria-label="Color theme">
                  <IconPalette size={18} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              {THEME_NAMES.map((name) => (
                <Menu.Item
                  key={name}
                  onClick={() => onThemeChange(name)}
                  leftSection={
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: THEMES[name].swatch,
                      }}
                    />
                  }
                  rightSection={name === themeName ? <IconCheck size={14} /> : null}
                >
                  {THEMES[name].label}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Refresh from NetBox">
            <ActionIcon
              variant="light"
              color="flame"
              size="lg"
              loading={refreshing}
              onClick={handleRefresh}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          <Anchor href="/logout" size="xs" c="dimmed">
            Logout
          </Anchor>
        </Group>
      </Group>

      <QuickLinksBar links={quicklinks} onChange={setQuicklinks} />

      {lastError && (
        <Alert
          color="red"
          icon={<IconAlertTriangle size={16} />}
          title="NetBox is unreachable — showing last known data"
          mb="md"
        >
          {lastError}
        </Alert>
      )}

      <div
        ref={fullscreenSectionRef}
        style={
          isFullscreen
            ? {
                background: 'var(--mantine-color-body)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 16,
                overflow: 'auto',
              }
            : undefined
        }
      >
        {servers && servers.length > 0 && (
          <StatStrip
            servers={servers}
            filter={statFilter}
            onFilterChange={setStatFilter}
            onResetAll={resetAllFilters}
          />
        )}

        <Group gap="sm" wrap="wrap" align="center">
          {/* flex: 1 so this block still claims the row's full width like it
              did before "Clear filters" was added as a sibling — without it,
              FilterBar's own internal flex:1 on the search input only grows
              within FilterBar's now content-sized box, and the whole row
              collapses/floats left instead of spanning it. */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <FilterBar
              ref={searchRef}
              search={search}
              onSearchChange={setSearch}
              kind={kind}
              onKindChange={setKind}
              site={site}
              onSiteChange={setSite}
              siteOptions={siteOptions}
              sort={sort}
              onSortChange={setSort}
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconX size={14} />}
              onClick={resetAllFilters}
            >
              Clear filters
            </Button>
          )}
        </Group>

        {servers === null ? (
          view === 'topology' || view === 'services' ? (
            <Skeleton height={560} radius="md" mt="md" />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md">
              {Array.from({ length: 6 }).map((_, i) => (
                <Stack key={i} gap="xs" p="md" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Group gap="xs">
                    <Skeleton height={28} width={28} radius="md" />
                    <Skeleton height={16} width="50%" />
                  </Group>
                  <Skeleton height={12} width="70%" />
                  <Skeleton height={12} width="40%" />
                </Stack>
              ))}
            </SimpleGrid>
          )
        ) : filtered.length === 0 ? (
          <Text c="dimmed" mt="xl" ta="center">
            No servers match.
          </Text>
        ) : view === 'topology' ? (
          <div style={{ marginTop: 16, ...(isFullscreen ? { flex: 1, minHeight: 0 } : {}) }}>
            <Suspense fallback={<Skeleton height={560} radius="md" />}>
              {/* Keying on the visible server ids (in order) forces a full
                  remount whenever search/filter/sort actually changes what's
                  shown — see TopologyView's own comment for why that's what
                  makes it re-fit the viewport to just the current selection
                  instead of leaving pan/zoom wherever it was. */}
              <TopologyView
                key={filtered.map((s) => s.id).join('|')}
                servers={filtered}
                onOpenServer={setModalServer}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </Suspense>
          </div>
        ) : view === 'services' ? (
          <ServicesView
            servers={filtered}
            onlyDown={statFilter === 'servicesDown'}
            onOpenServer={setModalServer}
          />
        ) : (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="md"
            mt="md"
            // Without this, expanding one card stretches every card sharing
            // its grid row to match (CSS grid's default align-items: stretch).
            style={{ alignItems: 'start' }}
          >
            {filtered.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                expanded={expandedIds.has(server.id)}
                onToggleExpand={() => toggleExpand(server.id)}
                onOpenModal={() => setModalServer(server)}
                groupColor={groupColorFor(server)}
              />
            ))}
          </SimpleGrid>
        )}
      </div>

      <ServerDetailModal server={modalServer} onClose={() => setModalServer(null)} />

      <HelpPanel displayTag={displayTag} />
    </Container>
  )
}
