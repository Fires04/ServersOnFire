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
import { ActionIcon, Tooltip } from '@mantine/core'
import { IconMaximize, IconMinimize } from '@tabler/icons-react'
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
  isFullscreen = false,
  onToggleFullscreen,
}: {
  servers: Server[]
  onOpenServer: (server: Server) => void
  /** Whether the *ancestor* container (App.tsx — canvas + filter bar
   * together, see its own comment) is currently the page's fullscreen
   * element. This component doesn't call the Fullscreen API itself: the
   * filter bar needs to stay usable in fullscreen too, so the element
   * that actually goes fullscreen has to be a shared ancestor, not this
   * canvas alone. */
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
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
        position: 'relative',
        height: isFullscreen ? '100%' : 560,
        borderRadius: isFullscreen ? 0 : 12,
        overflow: 'hidden',
        // Set by Root.tsx from the active color theme (see lib/themes.ts)
        // — the canvas stays a fixed dark ground regardless of the app's
        // own light/dark setting (see this component's own doc comment),
        // but which dark ground shifts with the chosen theme.
        background: 'var(--sof-topo-bg, #0d0f13)',
        border: isFullscreen ? 'none' : '1px solid #ffffff14',
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

      {onToggleFullscreen && (
        <Tooltip label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (filters included)'}>
          <ActionIcon
            variant="filled"
            color="dark"
            size="lg"
            radius="md"
            onClick={onToggleFullscreen}
            style={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}
          >
            {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
          </ActionIcon>
        </Tooltip>
      )}
    </div>
  )
}
