import { Group, SegmentedControl, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

export type KindFilter = 'all' | 'device' | 'vm'

export default function FilterBar({
  search,
  onSearchChange,
  kind,
  onKindChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  kind: KindFilter
  onKindChange: (value: KindFilter) => void
}) {
  return (
    <Group gap="sm" wrap="wrap">
      <TextInput
        placeholder="Search servers, services, roles, sites, tags…"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ flex: 1, minWidth: 220 }}
      />
      <SegmentedControl
        value={kind}
        onChange={(value) => onKindChange(value as KindFilter)}
        data={[
          { label: 'All', value: 'all' },
          { label: 'Devices', value: 'device' },
          { label: 'VMs', value: 'vm' },
        ]}
      />
    </Group>
  )
}
