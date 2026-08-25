import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Badge, Text, Tooltip } from '@mantine/core'
import type { Server } from '../../types'
import ServerIcon from '../ServerIcon'

// Kept in sync with layout.ts's SERVER_W — the layout math needs the
// node's real width to space columns without overlap.
export const SERVER_NODE_WIDTH = 200

const STATUS_HEX: Record<string, string> = {
  active: '#2dc291',
  staged: '#e8b339',
  planned: '#e8b339',
  offline: '#e8555a',
  failed: '#e8555a',
}

export type ServerNode = Node<
  { server: Server; onOpen: (server: Server) => void; hostedCount?: number },
  'server'
>

/** Card-style node for one server — the topology's "device" tier, styled to
 * sit on the always-dark canvas (see TopologyView) regardless of the app's
 * own light/dark setting, so it reads the same as the UniFi-style reference
 * look rather than washing out in light mode. */
export default function ServerNode({ data }: NodeProps<ServerNode>) {
  const { server, onOpen, hostedCount = 0 } = data
  const dotColor = STATUS_HEX[server.status] ?? '#8a8f98'
  const downServices = server.services.filter((s) => s.up === false).length

  return (
    <div
      onClick={() => onOpen(server)}
      style={{
        width: SERVER_NODE_WIDTH,
        padding: '10px 12px',
        borderRadius: 10,
        background: '#1c1f26',
        border: `1px solid ${downServices > 0 || dotColor === '#e8555a' ? '#e8555a55' : '#ffffff1a'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        color: '#e8e9ec',
      }}
    >
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            boxShadow: server.status === 'active' ? `0 0 6px ${dotColor}` : undefined,
          }}
        />
        <ServerIcon server={server} size={20} />
        {/* Two-line wrap instead of single-line truncate — "Housing-Host-
            1-Charlie" ellipsized into "Housing-H…" defeats the whole point
            of a topology view (knowing which box is which host at a
            glance). The line-clamp is just a backstop for the rare name
            that still doesn't fit in two lines; the tooltip covers that
            case. */}
        <Tooltip label={server.name} openDelay={400} disabled={server.name.length < 26}>
          <Text
            size="sm"
            fw={600}
            style={{
              color: '#e8e9ec',
              minWidth: 0,
              flex: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {server.name}
          </Text>
        </Tooltip>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {server.site_name && (
          <Text size="xs" truncate style={{ color: '#8a8f98', flex: 1, minWidth: 0 }}>
            {server.site_name}
          </Text>
        )}
        {hostedCount > 0 && (
          <Badge size="xs" variant="light" color="flame" style={{ flexShrink: 0 }}>
            {hostedCount} VM{hostedCount === 1 ? '' : 's'}
          </Badge>
        )}
        {server.services.length > 0 && (
          <Badge
            size="xs"
            variant="light"
            color={downServices > 0 ? 'red' : 'gray'}
            style={{ flexShrink: 0 }}
          >
            {server.services.length} svc
          </Badge>
        )}
      </div>
    </div>
  )
}

const handleStyle = { opacity: 0, width: 1, height: 1 }
