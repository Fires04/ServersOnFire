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
  const [selected, setSelected] = useState<Server | null>(null)

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
      const haystack = [s.name, s.role, s.site_name, s.tenant_name, ...s.tags].join(' ').toLowerCase()
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
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mt="md">
          {filtered.map((server) => (
            <ServerCard key={server.id} server={server} onClick={() => setSelected(server)} />
          ))}
        </SimpleGrid>
      )}

      <ServerDetailModal server={selected} onClose={() => setSelected(null)} />
    </Container>
  )
}
