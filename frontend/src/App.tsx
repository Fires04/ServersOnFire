import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Anchor,
  Container,
  Group,
  SimpleGrid,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconAlertTriangle, IconFlame, IconRefresh } from '@tabler/icons-react'
import { api } from './lib/api'
import type { Server } from './types'
import FilterBar, { type KindFilter } from './components/FilterBar'
import ServerCard from './components/ServerCard'
import ServerDetailModal from './components/ServerDetailModal'

export default function App() {
  const [servers, setServers] = useState<Server[] | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [modalServer, setModalServer] = useState<Server | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

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
  }

  useEffect(() => {
    load()
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

  const filtered = useMemo(() => {
    if (!servers) return []
    const needle = search.trim().toLowerCase()
    return servers.filter((s) => {
      if (kind !== 'all' && s.kind !== kind) return false
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
  }, [servers, search, kind])

  return (
    <Container size="lg" py="lg">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Group gap="xs">
          <IconFlame color="var(--mantine-color-flame-6)" />
          <Title order={2}>ServersOnFire</Title>
        </Group>
        <Group gap="xs">
          {generatedAt && (
            <Text size="xs" c="dimmed">
              Updated {new Date(generatedAt).toLocaleString()}
            </Text>
          )}
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

      <FilterBar search={search} onSearchChange={setSearch} kind={kind} onKindChange={setKind} />

      {servers === null ? (
        <Text c="dimmed" mt="xl">
          Loading…
        </Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed" mt="xl" ta="center">
          No servers match.
        </Text>
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
            />
          ))}
        </SimpleGrid>
      )}

      <ServerDetailModal server={modalServer} onClose={() => setModalServer(null)} />
    </Container>
  )
}
