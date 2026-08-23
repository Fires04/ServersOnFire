import { Anchor, Group, Text, ThemeIcon, Tooltip } from '@mantine/core'
import type { Service } from '../types'
import { serviceStatusColor } from '../theme'

const ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

export default function ServiceRow({ service }: { service: Service }) {
  const url = service.internal_url || service.external_url
  const statusLabel = service.up === null ? 'not monitored' : service.up ? 'up' : 'down'

  const body = (
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
    </Group>
  )

  if (!url) {
    return body
  }
  return (
    <Anchor href={url} target="_blank" rel="noreferrer" underline="never" c="inherit">
      {body}
    </Anchor>
  )
}
