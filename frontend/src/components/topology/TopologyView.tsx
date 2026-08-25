import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type NodeProps,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Server } from '../../types'
import ServerNode from './ServerNode'
import ServiceNode from './ServiceNode'
import { layoutTopology } from './layout'

type SiteLabelNode = Node<{ name: string }, 'siteLabel'>

function SiteLabelNodeComponent({ data }: NodeProps<SiteLabelNode>) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: '#5a5f68',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {data.name}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  server: ServerNode,
  service: ServiceNode,
  siteLabel: SiteLabelNodeComponent,
}

/** Network-topology-style view of the fleet — a horizontal backbone of
 * server nodes (in current sort/filter order) with each server's services
 * fanned out below it, styled after UniFi Network's topology map (dark
 * canvas, dotted "client" links, glowing status dots) rather than
 * Mantine's own light/dark theming — this view is a distinct "map" mode,
 * so it keeps its own fixed dark chrome in both app themes.
 *
 * The caller (App.tsx) remounts this component — via a `key` derived from
 * the visible server ids/order — every time search/filter/sort actually
 * changes the set or ordering of servers. That's deliberate: it's what
 * makes `fitView` below re-run and re-center/re-zoom on just the current
 * selection, instead of only fitting once on first load and then leaving
 * the viewport wherever it was as you filter down to fewer nodes. */
export default function TopologyView({
  servers,
  onOpenServer,
}: {
  servers: Server[]
  onOpenServer: (server: Server) => void
}) {
  const { nodes: baseNodes, edges: baseEdges, siteLabels } = useMemo(
    () => layoutTopology(servers, onOpenServer),
    [servers, onOpenServer],
  )

  const labelNodes: SiteLabelNode[] = siteLabels.map((label) => ({
    id: label.id,
    type: 'siteLabel',
    position: { x: label.x, y: 12 },
    data: { name: label.name },
    draggable: false,
    selectable: false,
  }))

  const [nodes, , onNodesChange] = useNodesState([...labelNodes, ...baseNodes])
  const [edges, , onEdgesChange] = useEdgesState(baseEdges)

  return (
    <div
      style={{
        height: 560,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0d0f13',
        border: '1px solid #ffffff14',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, duration: 300 }}
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff1a" />
        <Controls showInteractive={false} style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
      </ReactFlow>
    </div>
  )
}
