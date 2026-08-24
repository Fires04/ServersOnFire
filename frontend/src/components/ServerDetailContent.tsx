import { Divider, Stack, Text } from '@mantine/core'
import type { Server } from '../types'
import ParametersGrid from './ParametersGrid'
import BackupPanel from './BackupPanel'
import ServiceRow from './ServiceRow'
import TagBadges from './TagBadges'

/** The full per-server detail body — tags, parameters, backup, services.
 * Shared between ServerDetailModal (the popup) and ServerCard's in-place
 * expand, so the two stay in sync instead of drifting apart. */
export default function ServerDetailContent({ server }: { server: Server }) {
  return (
    <Stack gap="md">
      <TagBadges tags={server.tags} />

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
  )
}
