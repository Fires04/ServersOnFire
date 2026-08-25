import { ActionIcon, Group, Text, ThemeIcon, Tooltip } from '@mantine/core'
import { IconHome2, IconWorld } from '@tabler/icons-react'
import type { Service } from '../types'
import { serviceStatusColor } from '../theme'
import { ICON_BASE } from '../lib/icons'

// Separate LAN/Outside buttons at the row's end (mirrors netmap's
// app.js — 🏠 LAN / 🌐 Outside pill buttons) rather than making the whole
// row one link to whichever URL happened to be set: a service can have
// both an internal and an external URL, and burying the second one meant
// there was no way to reach it at all (see feedback screenshot).
export default function ServiceRow({ service }: { service: Service }) {
  const statusLabel = service.up === null ? 'not monitored' : service.up ? 'up' : 'down'

  return (
    <Group gap="xs" wrap="nowrap">
      <Tooltip label={statusLabel}>
        <ThemeIcon
          size={8}
          radius="xl"
          color={serviceStatusColor(service.up)}
          style={{ flexShrink: 0 }}
        />
      </Tooltip>
      <img
        src={`${ICON_BASE}/${service.icon_slug}.svg`}
        alt=""
        width={18}
        height={18}
        style={{ flexShrink: 0, objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <Text size="sm" fw={500} truncate>
        {service.name}
      </Text>
      {service.ports.length > 0 && (
        <Text size="xs" c="dimmed">
          :{service.ports.join(', ')}
        </Text>
      )}

      <Group gap={4} wrap="nowrap" ml="auto" style={{ flexShrink: 0 }}>
        {service.internal_url && (
          <Tooltip label="Open on LAN">
            <ActionIcon
              component="a"
              href={service.internal_url}
              target="_blank"
              rel="noreferrer"
              variant="subtle"
              color="gray"
              size="sm"
            >
              <IconHome2 size={14} />
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
              size="sm"
            >
              <IconWorld size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  )
}
