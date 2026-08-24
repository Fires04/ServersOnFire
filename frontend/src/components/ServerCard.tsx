import { ActionIcon, Badge, Card, Collapse, Divider, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core'
import { IconArrowsMaximize, IconChevronDown, IconDatabaseOff, IconShieldCheck } from '@tabler/icons-react'
import type { Server } from '../types'
import { serverStatusColor } from '../theme'
import ServerIcon from './ServerIcon'
import ServerDetailContent from './ServerDetailContent'
import TagBadges from './TagBadges'

export default function ServerCard({
  server,
  expanded,
  onToggleExpand,
  onOpenModal,
}: {
  server: Server
  expanded: boolean
  onToggleExpand: () => void
  onOpenModal: () => void
}) {
  return (
    <Card withBorder radius="md" p="md">
      <Stack gap="xs" onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flexShrink: 1 }}>
            <ServerIcon server={server} />
            <Tooltip label={server.name} openDelay={400} disabled={server.name.length < 22}>
              <Text fw={600} truncate>
                {server.name}
              </Text>
            </Tooltip>
          </Group>
          {/* flexShrink: 0 so the status badge and maximize icon never get
              compressed by a long name — all the squeeze belongs on the
              truncating name above, not here (a badge/icon shrinking just
              silently truncates its own label into "ACTI…", which reads as
              broken rather than intentional). */}
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Badge color={serverStatusColor(server.status)} variant="light" size="sm">
              {server.status || 'unknown'}
            </Badge>
            <Tooltip label="Open detail">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenModal()
                }}
              >
                <IconArrowsMaximize size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Group gap={6} wrap="wrap">
          {server.role && (
            <Text size="xs" c="dimmed">
              {server.role}
            </Text>
          )}
          {server.site_name && (
            <Text size="xs" c="dimmed">
              · {server.site_name}
            </Text>
          )}
          {server.tenant_name && (
            <Text size="xs" c="dimmed">
              · {server.tenant_name}
            </Text>
          )}
        </Group>

        <TagBadges tags={server.tags} size="xs" />

        <Group justify="space-between" wrap="nowrap" mt={4}>
          <Group gap={10} wrap="nowrap">
            <Text size="xs" c="dimmed">
              {server.services.length} {server.services.length === 1 ? 'service' : 'services'}
            </Text>
            <Tooltip label={server.backup ? 'Backup configured' : 'No backup configured'}>
              <ThemeIcon
                size={18}
                radius="xl"
                variant="light"
                color={server.backup ? 'flame' : 'gray'}
              >
                {server.backup ? <IconShieldCheck size={11} /> : <IconDatabaseOff size={11} />}
              </ThemeIcon>
            </Tooltip>
          </Group>
          <IconChevronDown
            size={16}
            style={{
              opacity: 0.5,
              transform: expanded ? 'rotate(180deg)' : undefined,
              transition: 'transform 150ms ease',
            }}
          />
        </Group>
      </Stack>

      <Collapse expanded={expanded}>
        <Divider my="sm" />
        <div onClick={(e) => e.stopPropagation()}>
          <ServerDetailContent server={server} showTags={false} />
        </div>
      </Collapse>
    </Card>
  )
}
