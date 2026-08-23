import { Badge, Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core'
import { IconDatabaseOff, IconServer, IconServer2, IconShieldCheck } from '@tabler/icons-react'
import type { Server } from '../types'
import { serverStatusColor } from '../theme'

export default function ServerCard({ server, onClick }: { server: Server; onClick: () => void }) {
  return (
    <Card withBorder radius="md" p="md" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon size={28} radius="md" variant="light" color="flame">
              {server.kind === 'device' ? <IconServer2 size={16} /> : <IconServer size={16} />}
            </ThemeIcon>
            <Text fw={600} truncate>
              {server.name}
            </Text>
          </Group>
          <Badge color={serverStatusColor(server.status)} variant="light" size="sm">
            {server.status || 'unknown'}
          </Badge>
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

        <Group justify="space-between" wrap="nowrap" mt={4}>
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
      </Stack>
    </Card>
  )
}
