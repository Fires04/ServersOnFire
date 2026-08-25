import type { ReactNode } from 'react'
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
}: {
  icon: ReactNode
  value: number
  label: string
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      onClick={onClick}
      className="sof-stat"
      style={{
        flex: '1 1 140px',
        cursor: 'pointer',
        borderColor: active ? `var(--mantine-color-${color}-5)` : undefined,
        background: active ? `var(--mantine-color-${color}-light)` : undefined,
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={36} radius="md" variant={active ? 'filled' : 'light'} color={color}>
          {icon}
        </ThemeIcon>
        <div>
          <Text fw={700} size="lg" lh={1.1}>
            {value}
          </Text>
          <Text size="xs" c="dimmed">
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
 * as a filter. */
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
  const total = servers.length
  const active = servers.filter((s) => s.status === 'active').length
  const issues = total - active

  const services = servers.flatMap((s) => s.services)
  const servicesDown = services.filter((svc) => svc.up === false).length

  function toggle(value: StatFilter) {
    onFilterChange(filter === value ? 'all' : value)
  }

  return (
    <Group gap="sm" wrap="wrap" mb="md">
      <Stat
        icon={<IconServer size={18} />}
        value={total}
        label="servers"
        color="flame"
        active={filter === 'all'}
        onClick={onResetAll}
      />
      <Stat
        icon={<IconCircleCheck size={18} />}
        value={active}
        label="active"
        color="teal"
        active={filter === 'active'}
        onClick={() => toggle('active')}
      />
      <Stat
        icon={<IconAlertTriangle size={18} />}
        value={issues}
        label={issues === 1 ? 'needs attention' : 'need attention'}
        color={issues > 0 ? 'red' : 'gray'}
        active={filter === 'issues'}
        onClick={() => issues > 0 && toggle('issues')}
      />
      <Stat
        icon={<IconStack2 size={18} />}
        value={services.length}
        label={servicesDown > 0 ? `services (${servicesDown} down)` : 'services'}
        color={servicesDown > 0 ? 'red' : 'flame'}
        active={filter === 'servicesDown'}
        onClick={() => servicesDown > 0 && toggle('servicesDown')}
      />
    </Group>
  )
}
