import { SimpleGrid, Text } from '@mantine/core'
import type { Server } from '../types'

interface Row {
  label: string
  value: string
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
  if (p.disk_gb !== undefined) rows.push({ label: 'Disk', value: `${p.disk_gb} GB` })
  if (server.primary_ip) rows.push({ label: 'Primary IP', value: server.primary_ip })
  if (server.site_name) rows.push({ label: 'Site', value: server.site_name })
  if (server.tenant_name) rows.push({ label: 'Tenant', value: server.tenant_name })

  return rows
}

export default function ParametersGrid({ server }: { server: Server }) {
  const rows = rowsFor(server)
  if (rows.length === 0) return null

  return (
    <SimpleGrid cols={2} spacing="xs" verticalSpacing={4}>
      {rows.map((row) => (
        <Text key={row.label} size="sm" span>
          <Text span c="dimmed">
            {row.label}:{' '}
          </Text>
          {row.value}
        </Text>
      ))}
    </SimpleGrid>
  )
}
