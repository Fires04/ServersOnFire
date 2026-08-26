import { ActionIcon, Collapse, Group, Indicator, Select, SegmentedControl, TextInput } from '@mantine/core'
import { IconFilter, IconSearch } from '@tabler/icons-react'
import { useMediaQuery } from '@mantine/hooks'
import { forwardRef, useState } from 'react'

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
  // Below this width, kind/site/sort collapse behind a toggle so the
  // search field + results sit as close together as possible — on a
  // phone, the on-screen keyboard alone already eats ~40% of the screen
  // while typing a search; three extra full-width controls stacked above
  // the results left barely anything visible without dismissing it first.
  const isMobile = useMediaQuery('(max-width: 36em)')
  const [showMore, setShowMore] = useState(false)
  const hasNonDefaultFilter = kind !== 'all' || site !== null || sort !== 'name'

  const extraControls = (
    <>
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
    </>
  )

  const searchInput = (
    <TextInput
      ref={searchRef}
      placeholder={isMobile ? 'Search… ( / )' : 'Search servers, services, roles, sites, tags… ( / )'}
      leftSection={<IconSearch size={16} />}
      value={search}
      onChange={(e) => onSearchChange(e.currentTarget.value)}
      style={{ flex: 1, minWidth: isMobile ? 0 : 220 }}
    />
  )

  if (!isMobile) {
    return (
      <Group gap="sm" wrap="wrap">
        {searchInput}
        {extraControls}
      </Group>
    )
  }

  return (
    <div>
      <Group gap="xs" wrap="nowrap">
        {searchInput}
        <Indicator disabled={!hasNonDefaultFilter} size={8} color="flame" offset={3}>
          <ActionIcon
            variant={showMore ? 'filled' : 'default'}
            color={showMore ? 'flame' : 'gray'}
            size="lg"
            onClick={() => setShowMore((v) => !v)}
            aria-label="More filters"
          >
            <IconFilter size={16} />
          </ActionIcon>
        </Indicator>
      </Group>
      <Collapse expanded={showMore}>
        <Group gap="sm" wrap="wrap" mt="xs">
          {extraControls}
        </Group>
      </Collapse>
    </div>
  )
})

export default FilterBar
