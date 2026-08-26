import type { Server } from '../types'

export interface HostGroups {
  /** Device name -> its hosted VMs, for devices that host at least one VM
   * present in the same list. */
  vmsByHost: Map<string, Server[]>
  /** VM id -> its host device's name, for VMs whose host is in the list. */
  hostNameById: Map<string, string>
}

/** Matches VMs to their physical host via NetBox's Cluster field (a VM's
 * `params.hypervisor` is the name of the device that shares its Cluster —
 * see dataset.py's `_cluster_hosts`) against whichever devices are
 * actually present in `servers`. A VM whose host got filtered out (or
 * whose device-side Cluster was never set in NetBox — see HelpPanel) just
 * has no entry in `hostNameById`, same as a VM with no host at all.
 *
 * Shared by the topology view's layout (host/VM/service tree) and the
 * card view's per-host color grouping — both need the same "who hosts
 * whom" answer from the same list. */
export function computeHostGroups(servers: Server[]): HostGroups {
  const deviceByName = new Map(servers.filter((s) => s.kind === 'device').map((s) => [s.name, s]))
  const vmsByHost = new Map<string, Server[]>()
  const hostNameById = new Map<string, string>()

  for (const s of servers) {
    const hostName = s.kind === 'vm' ? s.params.hypervisor : undefined
    if (hostName && deviceByName.has(hostName)) {
      const arr = vmsByHost.get(hostName) ?? []
      arr.push(s)
      vmsByHost.set(hostName, arr)
      hostNameById.set(s.id, hostName)
    }
  }

  return { vmsByHost, hostNameById }
}

// Mantine color names, deliberately excluding ones that already carry a
// status meaning elsewhere in the app (teal=active, yellow=staged/planned,
// red=offline/issue, gray=unknown/neutral) and "flame" (the brand accent)
// — a host's group color needs to read as *just* grouping, not another
// status signal, and stay visually distinct from those.
const GROUP_PALETTE = ['blue', 'grape', 'cyan', 'violet', 'indigo', 'pink', 'lime'] as const

/** Deterministic host-name -> color, so a given host is always the same
 * color regardless of sort/filter/render order (a plain "next color in the
 * list" index would reshuffle colors every time the visible order
 * changes, which reads as random rather than as a stable per-host
 * identity). */
export function hostGroupColor(hostName: string): string {
  let hash = 0
  for (let i = 0; i < hostName.length; i++) {
    hash = (hash * 31 + hostName.charCodeAt(i)) | 0
  }
  return GROUP_PALETTE[Math.abs(hash) % GROUP_PALETTE.length]
}
