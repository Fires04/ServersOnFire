import { Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconArrowRight, IconDatabaseOff, IconShieldCheck } from '@tabler/icons-react'
import type { BackupInfo } from '../types'

// Rendered prominently on every server — right now `backup` is null on
// every single host in NetBox (see backend/app/dataset.py), so the empty
// state below is the default render, not a rare edge case. It needs to
// read as "nothing set yet", not as something broken.
export default function BackupPanel({ backup }: { backup: BackupInfo | null }) {
  if (!backup) {
    return (
      <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-default-hover)">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={24} radius="xl" color="gray" variant="light">
            <IconDatabaseOff size={14} />
          </ThemeIcon>
          <Text size="sm" c="dimmed">
            No backup configured in NetBox
          </Text>
        </Group>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap={4}>
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={24} radius="xl" color="flame" variant="light">
            <IconShieldCheck size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600}>
            {backup.method ?? 'Backup'}
          </Text>
          {backup.target_name && (
            <Group gap={4} wrap="nowrap">
              <IconArrowRight size={14} style={{ opacity: 0.6 }} />
              <Text size="sm">{backup.target_name}</Text>
            </Group>
          )}
        </Group>
        {backup.path && (
          <Text size="xs" c="dimmed" ff="monospace" ml={32}>
            {backup.path}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
