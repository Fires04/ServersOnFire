import type { ReactNode } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import { Group, Paper, Text, ThemeIcon } from '@mantine/core'
import {
  IconCircleCheck,
  IconServer,
  IconStack2,
  IconAlertTriangle,
} from '@tabler/icons-react'
import type { Server } from '../types'

export type StatFilter = 'all' | 'active' | 'issues' | 'servicesDown'

/** One small stat tile: icon + big number + label underneath. Doubles as a
 * filter toggle — clicking it applies (or, if already active, clears) the
 * corresponding StatFilter, so the fleet-health summary and the filter
 * controls aren't two separate things to keep in sync. */
function Stat({
  icon,
  value,
  label,
  color,
  active,
  onClick,
  compact,
}: {
  icon: ReactNode
  value: number
  label: string
  color: string
  active: boolean
  onClick: () => void
  compact: boolean
}) {
  return (
    <Paper
      withBorder
      radius="md"
      p={compact ? 6 : 'sm'}
      onClick={onClick}
      className="sof-stat"
      style={{
        flex: '1 1 140px',
        cursor: 'pointer',
        borderColor: active ? `var(--mantine-color-${color}-5)` : undefined,
        background: active ? `var(--mantine-color-${color}-light)` : undefined,
      }}
    >
      <Group gap={compact ? 6 : 'sm'} wrap="nowrap">
        <ThemeIcon size={compact ? 26 : 36} radius="md" variant={active ? 'filled' : 'light'} color={color}>
          {icon}
        </ThemeIcon>
        <div style={{ minWidth: 0 }}>
          <Text ff="monospace" fw={700} size={compact ? 'sm' : 'lg'} lh={1.1}>
            {value}
          </Text>
          <Text size="xs" c="dimmed" truncate={compact}>
            {label}
          </Text>
        </div>
      </Group>
    </Paper>
  )
}

/** Fleet-wide health summary, deliberately computed from the *full* dataset
 * rather than the currently-filtered/searched list — this is meant to
 * answer "is anything on fire right now", which shouldn't change just
 * because someone typed into the search box or clicked one of these tiles
 * as a filter. Shrinks itself (smaller padding/icons, no separate label
 * line room) below phone width — on a small screen every bit of vertical
 * space before the results matters, especially once the keyboard is up. */
export default function StatStrip({
  servers,
  filter,
  onFilterChange,
  onResetAll,
}: {
  servers: Server[]
  filter: StatFilter
  onFilterChange: (filter: StatFilter) => void
  /** Clears *every* filter (search/kind/site/sort too), not just this
   * strip's own StatFilter — wired to the "servers" tile below so it reads
   * as the obvious way back to "show me everything" regardless of which
   * control was used to narrow the view. */
  onResetAll: () => void
}) {
  const compact = useMediaQuery('(max-width: 36em)') ?? false

  const total = servers.length
  const active = servers.filter((s) => s.status === 'active').length
  const issues = total - active

  const services = servers.flatMap((s) => s.services)
  const servicesDown = services.filter((svc) => svc.up === false).length

  function toggle(value: StatFilter) {
    onFilterChange(filter === value ? 'all' : value)
  }

  return (
    <Group gap={compact ? 6 : 'sm'} wrap="wrap" mb={compact ? 'xs' : 'md'}>
      <Stat
        icon={<IconServer size={compact ? 14 : 18} />}
        value={total}
        label="servers"
        color="flame"
        active={filter === 'all'}
        onClick={onResetAll}
        compact={compact}
      />
      <Stat
        icon={<IconCircleCheck size={compact ? 14 : 18} />}
        value={active}
        label="active"
        color="teal"
        active={filter === 'active'}
        onClick={() => toggle('active')}
        compact={compact}
      />
      <Stat
        icon={<IconAlertTriangle size={compact ? 14 : 18} />}
        value={issues}
        label={issues === 1 ? 'needs attention' : 'need attention'}
        color={issues > 0 ? 'red' : 'gray'}
        active={filter === 'issues'}
        onClick={() => issues > 0 && toggle('issues')}
        compact={compact}
      />
      <Stat
        icon={<IconStack2 size={compact ? 14 : 18} />}
        value={services.length}
        label={servicesDown > 0 ? `services (${servicesDown} down)` : 'services'}
        color={servicesDown > 0 ? 'red' : 'flame'}
        active={filter === 'servicesDown'}
        onClick={() => servicesDown > 0 && toggle('servicesDown')}
        compact={compact}
      />
    </Group>
  )
}
