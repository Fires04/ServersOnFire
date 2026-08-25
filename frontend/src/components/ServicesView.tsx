import { useMemo, useState } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { ActionIcon, Group, Paper, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core'
import { IconApps, IconHome2, IconWorld } from '@tabler/icons-react'
import type { Server, Service } from '../types'
import { serviceStatusColor } from '../theme'
import { ICON_BASE } from '../lib/icons'

function ServiceIcon({ service, size }: { service: Service; size: number }) {
  const [failed, setFailed] = useState(false)
  const statusLabel = service.up === null ? 'not monitored' : service.up ? 'up' : 'down'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {failed || !service.icon_slug ? (
        <IconApps size={size} color="var(--mantine-color-dimmed)" />
      ) : (
        <img
          src={`${ICON_BASE}/${service.icon_slug}.svg`}
          alt=""
          width={size}
          height={size}
          style={{ objectFit: 'contain' }}
          onError={() => setFailed(true)}
        />
      )}
      <Tooltip label={statusLabel}>
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -4,
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: `var(--mantine-color-${serviceStatusColor(service.up)}-6)`,
            border: '2px solid var(--mantine-color-body)',
          }}
        />
      </Tooltip>
    </div>
  )
}

function ServiceLinkButtons({
  service,
  size,
  iconSize,
}: {
  service: Service
  size: string
  iconSize: number
}) {
  return (
    <Group gap={4} wrap="nowrap">
      {service.internal_url && (
        <Tooltip label="Open on LAN">
          <ActionIcon
            component="a"
            href={service.internal_url}
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            color="gray"
            size={size}
            onClick={(e) => e.stopPropagation()}
          >
            <IconHome2 size={iconSize} />
          </ActionIcon>
        </Tooltip>
      )}
      {service.external_url && (
        <Tooltip label="Open externally">
          <ActionIcon
            component="a"
            href={service.external_url}
            target="_blank"
            rel="noreferrer"
            variant="subtle"
            color="gray"
            size={size}
            onClick={(e) => e.stopPropagation()}
          >
            <IconWorld size={iconSize} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}

function ServiceTile({
  server,
  service,
  onOpenServer,
}: {
  server: Server
  service: Service
  onOpenServer: (server: Server) => void
}) {
  return (
    <Paper withBorder radius="md" p="sm" className="sof-card">
      <Stack gap={6} align="center" ta="center">
        <ServiceIcon service={service} size={30} />

        <Text size="sm" fw={600} truncate w="100%">
          {service.name}
        </Text>
        <Text
          size="xs"
          c="dimmed"
          truncate
          w="100%"
          onClick={(e) => {
            e.stopPropagation()
            onOpenServer(server)
          }}
          style={{ cursor: 'pointer' }}
        >
          {server.name}
        </Text>

        <ServiceLinkButtons service={service} size="sm" iconSize={14} />
      </Stack>
    </Paper>
  )
}

// Row layout for narrow screens: a tap-friendly icon-grid works on desktop
// where a mouse can land precisely on a 30px tile, but on a phone the same
// grid turns "open the right service" into a fiddly game of thumb
// accuracy. A single-column list with a full-width tap target and bigger
// link buttons is the same tradeoff most mobile launcher/dashboard apps
// make (Homer, Homarr's "list" mode, etc).
function ServiceListRow({
  server,
  service,
  onOpenServer,
}: {
  server: Server
  service: Service
  onOpenServer: (server: Server) => void
}) {
  return (
    <Paper withBorder radius="md" p="sm" className="sof-card">
      <Group gap="sm" wrap="nowrap">
        <ServiceIcon service={service} size={32} />
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>
            {service.name}
          </Text>
          <Text
            size="xs"
            c="dimmed"
            truncate
            onClick={(e) => {
              e.stopPropagation()
              onOpenServer(server)
            }}
          >
            {server.name}
          </Text>
        </Stack>
        <ServiceLinkButtons service={service} size="lg" iconSize={18} />
      </Group>
    </Paper>
  )
}

/** Flat icon-grid of every service across the (filtered) fleet — a
 * homer/homarr-style launcher rather than a per-server breakdown, matching
 * how home.fireit.cz/netmap presented services before this dashboard
 * replaced it. `onlyDown` narrows to services currently reporting down,
 * wired from the stat strip's "services (N down)" tile so that filter
 * means the same thing here as it does in the card/topology views.
 *
 * Below the `sm` breakpoint this switches from the icon grid to a
 * single-column list (see ServiceListRow) — mobile-optimized, not just a
 * smaller version of the same grid. */
export default function ServicesView({
  servers,
  onlyDown,
  onOpenServer,
}: {
  servers: Server[]
  onlyDown: boolean
  onOpenServer: (server: Server) => void
}) {
  const isMobile = useMediaQuery('(max-width: 36em)')

  const tiles = useMemo(() => {
    const all = servers.flatMap((server) =>
      server.services.map((service) => ({ server, service })),
    )
    const filtered = onlyDown ? all.filter((t) => t.service.up === false) : all
    return filtered.sort((a, b) => a.service.name.localeCompare(b.service.name))
  }, [servers, onlyDown])

  if (tiles.length === 0) {
    return (
      <Text c="dimmed" mt="xl" ta="center">
        No services match.
      </Text>
    )
  }

  return (
    <>
      <Text size="sm" c="dimmed" mt="md" mb="xs">
        {tiles.length} {tiles.length === 1 ? 'service' : 'services'}
      </Text>
      {isMobile ? (
        <Stack gap="xs">
          {tiles.map(({ server, service }) => (
            <ServiceListRow
              key={`${server.id}-${service.name}`}
              server={server}
              service={service}
              onOpenServer={onOpenServer}
            />
          ))}
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="sm">
          {tiles.map(({ server, service }) => (
            <ServiceTile
              key={`${server.id}-${service.name}`}
              server={server}
              service={service}
              onOpenServer={onOpenServer}
            />
          ))}
        </SimpleGrid>
      )}
    </>
  )
}
