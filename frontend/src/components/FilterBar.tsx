import { Group, Select, SegmentedControl, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { forwardRef } from 'react'

export type KindFilter = 'all' | 'device' | 'vm'
export type SortOption = 'name' | 'status' | 'services' | 'vcpus' | 'memory' | 'disk'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'services', label: 'Most services' },
  { value: 'vcpus', label: 'Most vCPUs' },
  { value: 'memory', label: 'Most RAM' },
  { value: 'disk', label: 'Most disk' },
]

const FilterBar = forwardRef<
  HTMLInputElement,
  {
    search: string
    onSearchChange: (value: string) => void
    kind: KindFilter
    onKindChange: (value: KindFilter) => void
    site: string | null
    onSiteChange: (value: string | null) => void
    siteOptions: string[]
    sort: SortOption
    onSortChange: (value: SortOption) => void
  }
>(function FilterBar(
  { search, onSearchChange, kind, onKindChange, site, onSiteChange, siteOptions, sort, onSortChange },
  searchRef,
) {
  return (
    <Group gap="sm" wrap="wrap">
      <TextInput
        ref={searchRef}
        placeholder="Search servers, services, roles, sites, tags… ( / )"
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
      {siteOptions.length > 1 && (
        <Select
          placeholder="Site"
          data={siteOptions}
          value={site}
          onChange={onSiteChange}
          clearable
          style={{ width: 150 }}
        />
      )}
      <Select
        data={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        value={sort}
        onChange={(value) => onSortChange((value as SortOption) ?? 'name')}
        allowDeselect={false}
        style={{ width: 170 }}
      />
    </Group>
  )
})

export default FilterBar
