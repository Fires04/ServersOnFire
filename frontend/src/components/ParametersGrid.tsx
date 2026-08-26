import { Fragment } from 'react'
import { Text } from '@mantine/core'
import type { Server } from '../types'

interface Row {
  label: string
  value: string
}

function formatDisk(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb} GB`
}

// Only ever shows fields NetBox actually returned — no field is invented
// or defaulted to a placeholder (see backend/app/dataset.py).
function rowsFor(server: Server): Row[] {
  const rows: Row[] = []
  const p = server.params

  if (p.device_type) rows.push({ label: 'Device type', value: p.device_type })
  if (p.platform) rows.push({ label: 'Platform', value: p.platform })
  if (p.cluster) rows.push({ label: 'Cluster', value: p.cluster })
  if (p.hypervisor) rows.push({ label: 'Hypervisor', value: p.hypervisor })
  if (p.vcpus !== undefined) rows.push({ label: 'vCPUs', value: String(p.vcpus) })
  if (p.memory_mb !== undefined) rows.push({ label: 'Memory', value: `${(p.memory_mb / 1024).toFixed(1)} GB` })
  if (p.disk_gb !== undefined) rows.push({ label: 'Disk', value: formatDisk(p.disk_gb) })
  if (server.primary_ip) rows.push({ label: 'Primary IP', value: server.primary_ip })
  if (server.site_name) rows.push({ label: 'Site', value: server.site_name })
  if (server.tenant_name) rows.push({ label: 'Tenant', value: server.tenant_name })

  return rows
}

// A single column of label/value rows on a fixed-width label column, not
// the previous 2-across grid of "Label: value" inline text — that let a
// long value (e.g. "Debian 13 (trixie)") wrap onto its own second line
// with nothing to align it to, so the two columns drifted out of step with
// each other and got hard to scan (see feedback screenshot: "cluttered").
// A single aligned column reads top-to-bottom cleanly regardless of how
// many values wrap.
export default function ParametersGrid({ server }: { server: Server }) {
  const rows = rowsFor(server)
  if (rows.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        columnGap: 12,
        rowGap: 6,
      }}
    >
      {rows.map((row) => (
        <Fragment key={row.label}>
          <Text size="sm" c="dimmed">
            {row.label}
          </Text>
          <Text size="sm" fw={500}>
            {row.value}
          </Text>
        </Fragment>
      ))}
    </div>
  )
}
