import { Badge, Divider, Group, Modal, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconServer, IconServer2 } from '@tabler/icons-react'
import type { Server } from '../types'
import { serverStatusColor } from '../theme'
import ParametersGrid from './ParametersGrid'
import BackupPanel from './BackupPanel'
import ServiceRow from './ServiceRow'

export default function ServerDetailModal({
  server,
  onClose,
}: {
  server: Server | null
  onClose: () => void
}) {
  return (
    <Modal opened={server !== null} onClose={onClose} title={null} size="lg" radius="md">
      {server && (
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size={32} radius="md" variant="light" color="flame">
                {server.kind === 'device' ? <IconServer2 size={18} /> : <IconServer size={18} />}
              </ThemeIcon>
              <Text fw={700} size="lg">
                {server.name}
              </Text>
            </Group>
            <Badge color={serverStatusColor(server.status)} variant="light">
              {server.status || 'unknown'}
            </Badge>
          </Group>

          {server.tags.length > 0 && (
            <Group gap={6}>
              {server.tags.map((tag) => (
                <Badge key={tag} variant="outline" color="gray" size="sm">
                  {tag}
                </Badge>
              ))}
            </Group>
          )}

          <ParametersGrid server={server} />

          <Divider label="Backup" labelPosition="left" />
          <BackupPanel backup={server.backup} />

          <Divider label={`Services (${server.services.length})`} labelPosition="left" />
          {server.services.length === 0 ? (
            <Text size="sm" c="dimmed">
              No services in NetBox for this host.
            </Text>
          ) : (
            <Stack gap={6}>
              {server.services.map((svc) => (
                <ServiceRow key={svc.name} service={svc} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Modal>
  )
}
