import { Badge, Group, Modal, Stack, Text } from '@mantine/core'
import type { Server } from '../types'
import { serverStatusColor } from '../theme'
import ServerIcon from './ServerIcon'
import ServerDetailContent from './ServerDetailContent'

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
              <ServerIcon server={server} size={32} />
              <Text fw={700} size="lg">
                {server.name}
              </Text>
            </Group>
            <Badge color={serverStatusColor(server.status)} variant="light">
              {server.status || 'unknown'}
            </Badge>
          </Group>

          <ServerDetailContent server={server} />
        </Stack>
      )}
    </Modal>
  )
}
