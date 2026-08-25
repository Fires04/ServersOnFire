import type { Edge } from '@xyflow/react'
import type { Server, Service } from '../../types'
import { SERVER_NODE_WIDTH, type ServerNode } from './ServerNode'
import type { ServiceNode } from './ServiceNode'

const SERVER_W = SERVER_NODE_WIDTH
const SERVICE_W = 112
const H_GAP = 20
const SITE_GAP = 56
const SERVICES_PER_ROW = 4
const SERVICE_ROW_H = 78

// Three fixed vertical bands. A root (device, or a VM with no tracked
// host) sits in ROOT_Y. If it hosts VMs, those VMs — plus the root's own
// services, mixed into the same row as small leaves — sit in VM_Y; each
// VM's own services then drop one more band to VM_SERVICES_Y. A root
// *without* hosted VMs instead fans its own services directly into
// ROOT_SERVICES_Y, which lines up with VM_Y so columns of either shape
// still read as one consistent grid.
const ROOT_Y = 50
const ROOT_SERVICES_Y = 190
const VM_Y = 190
const VM_SERVICES_Y = 330

export type SiteLabel = { id: string; x: number; name: string }

type FlowNode = ServerNode | ServiceNode

/** Lays the fleet out as a host/VM topology: physical devices form a
 * horizontal "backbone" row (chained by trunk edges); each device's own
 * hosted VMs (matched via `params.hypervisor` against a device *present in
 * this same server list*) hang below it as its own sub-column, with their
 * services fanned out one band further down. A VM whose host isn't in the
 * current (possibly filtered) list — or a device with no VMs — just fans
 * its own services directly beneath it, same as before.
 *
 * No generic graph-layout library involved — this is a plain host -> VM ->
 * services tree, capped at that fixed depth by NetBox's own model (a VM
 * never hosts another VM), so a hand-rolled left-to-right cursor is simpler
 * and more predictable than pulling in dagre/elk for it. */
export function layoutTopology(
  servers: Server[],
  onOpen: (server: Server) => void,
): { nodes: FlowNode[]; edges: Edge[]; siteLabels: SiteLabel[] } {
  const nodes: FlowNode[] = []
  const edges: Edge[] = []
  const siteLabels: SiteLabel[] = []

  const deviceByName = new Map(servers.filter((s) => s.kind === 'device').map((s) => [s.name, s]))
  const vmsByHost = new Map<string, Server[]>()
  const roots: Server[] = []
  for (const s of servers) {
    const hostName = s.kind === 'vm' ? s.params.hypervisor : undefined
    if (hostName && deviceByName.has(hostName)) {
      const arr = vmsByHost.get(hostName) ?? []
      arr.push(s)
      vmsByHost.set(hostName, arr)
    } else {
      roots.push(s)
    }
  }

  function serviceFanWidth(count: number): number {
    if (count === 0) return 0
    const cols = Math.min(count, SERVICES_PER_ROW)
    return cols * SERVICE_W + (cols - 1) * H_GAP
  }

  function vmBlockWidth(vm: Server): number {
    return Math.max(SERVER_W, serviceFanWidth(vm.services.length))
  }

  function rootBlockWidth(root: Server, vms: Server[] | undefined): number {
    if (vms && vms.length > 0) {
      const childWidths = [...vms.map(vmBlockWidth), ...root.services.map(() => SERVICE_W)]
      const total = childWidths.reduce((a, b) => a + b, 0) + H_GAP * Math.max(0, childWidths.length - 1)
      return Math.max(SERVER_W, total)
    }
    return Math.max(SERVER_W, serviceFanWidth(root.services.length))
  }

  function placeServiceFan(services: Service[], parentId: string, blockCenterX: number, y: number) {
    services.forEach((svc, i) => {
      const row = Math.floor(i / SERVICES_PER_ROW)
      const rowStart = row * SERVICES_PER_ROW
      const rowCols = Math.min(services.length - rowStart, SERVICES_PER_ROW)
      const rowWidth = rowCols * SERVICE_W + (rowCols - 1) * H_GAP
      const rowStartX = blockCenterX - rowWidth / 2
      const col = i - rowStart
      const svcId = `${parentId}-svc-${i}`

      nodes.push({
        id: svcId,
        type: 'service',
        position: { x: rowStartX + col * (SERVICE_W + H_GAP), y: y + row * SERVICE_ROW_H },
        data: { service: svc },
        draggable: true,
      })
      edges.push({
        id: `edge-${svcId}`,
        source: parentId,
        sourceHandle: 'bottom',
        target: svcId,
        targetHandle: 'top',
        type: 'straight',
        style: {
          stroke: svc.up === false ? '#e8555a99' : '#ffffff33',
          strokeWidth: 1,
          strokeDasharray: '3 3',
        },
        selectable: false,
        focusable: false,
        zIndex: 0,
      })
    })
  }

  function placeVM(vm: Server, x: number): number {
    const width = vmBlockWidth(vm)
    const centerX = x + width / 2
    nodes.push({
      id: vm.id,
      type: 'server',
      position: { x: centerX - SERVER_W / 2, y: VM_Y },
      data: { server: vm, onOpen },
      draggable: true,
    })
    placeServiceFan(vm.services, vm.id, centerX, VM_SERVICES_Y)
    return width
  }

  let cursorX = 0
  let prevRootId: string | null = null
  let prevSite: string | null | undefined = undefined

  for (const root of roots) {
    if (root.site_name !== prevSite) {
      if (prevSite !== undefined) cursorX += SITE_GAP
      siteLabels.push({ id: `site-${root.id}`, x: cursorX, name: root.site_name ?? 'No site' })
      prevSite = root.site_name
    }

    const vms = vmsByHost.get(root.name)
    const blockWidth = rootBlockWidth(root, vms)
    const centerX = cursorX + blockWidth / 2

    nodes.push({
      id: root.id,
      type: 'server',
      position: { x: centerX - SERVER_W / 2, y: ROOT_Y },
      data: { server: root, onOpen, hostedCount: vms?.length ?? 0 },
      draggable: true,
    })

    if (prevRootId) {
      edges.push({
        id: `trunk-${prevRootId}-${root.id}`,
        source: prevRootId,
        sourceHandle: 'right',
        target: root.id,
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#ffffff26', strokeWidth: 1.5 },
        selectable: false,
        focusable: false,
        zIndex: 0,
      })
    }
    prevRootId = root.id

    if (vms && vms.length > 0) {
      const childWidths = [...vms.map(vmBlockWidth), ...root.services.map(() => SERVICE_W)]
      const childrenTotalWidth = childWidths.reduce((a, b) => a + b, 0) + H_GAP * Math.max(0, childWidths.length - 1)
      let childX = centerX - childrenTotalWidth / 2

      for (const vm of vms) {
        const w = placeVM(vm, childX)
        edges.push({
          id: `hosts-${root.id}-${vm.id}`,
          source: root.id,
          sourceHandle: 'bottom',
          target: vm.id,
          targetHandle: 'top',
          type: 'straight',
          // Solid + brighter than the dotted service links — a hosting
          // relationship is a stronger, structural connection, not a
          // network health check.
          style: { stroke: '#ffffff40', strokeWidth: 1.5 },
          selectable: false,
          focusable: false,
          zIndex: 0,
        })
        childX += w + H_GAP
      }

      // The host's own services (if it runs any directly) are mixed into
      // the same row as its VMs, as plain leaves — they have no further
      // children of their own so they don't need a sub-column.
      root.services.forEach((svc, i) => {
        const svcId = `${root.id}-svc-${i}`
        nodes.push({
          id: svcId,
          type: 'service',
          position: { x: childX, y: VM_Y },
          data: { service: svc },
          draggable: true,
        })
        edges.push({
          id: `edge-${svcId}`,
          source: root.id,
          sourceHandle: 'bottom',
          target: svcId,
          targetHandle: 'top',
          type: 'straight',
          style: {
            stroke: svc.up === false ? '#e8555a99' : '#ffffff33',
            strokeWidth: 1,
            strokeDasharray: '3 3',
          },
          selectable: false,
          focusable: false,
          zIndex: 0,
        })
        childX += SERVICE_W + H_GAP
      })
    } else {
      placeServiceFan(root.services, root.id, centerX, ROOT_SERVICES_Y)
    }

    cursorX += blockWidth + H_GAP * 2
  }

  return { nodes, edges, siteLabels }
}
