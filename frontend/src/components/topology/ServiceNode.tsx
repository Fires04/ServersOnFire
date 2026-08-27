import { useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Text, Tooltip } from '@mantine/core'
import { IconApps, IconHome2, IconWorld } from '@tabler/icons-react'
import type { Service } from '../../types'
import { ICON_BASE } from '../../lib/icons'

const UP_HEX = '#2dc291'
const DOWN_HEX = '#e8555a'
const UNKNOWN_HEX = '#5a5f68'

export type ServiceNode = Node<{ service: Service }, 'service'>

/** Leaf node for one service hanging off a server — the topology's
 * "client" tier, deliberately smaller/quieter than ServerNode so the eye
 * lands on devices first. Carries the same LAN/external open buttons as
 * ServiceRow (the card view's service list) so a service is just as
 * reachable from the topology, not only inspectable. */
export default function ServiceNode({ data }: NodeProps<ServiceNode>) {
  const { service } = data
  const [iconFailed, setIconFailed] = useState(false)
  const dotColor = service.up === null ? UNKNOWN_HEX : service.up ? UP_HEX : DOWN_HEX
  const statusLabel = service.up === null ? 'not monitored' : service.up ? 'up' : 'down'

  return (
    <div
      style={{
        width: 112,
        padding: '6px 8px',
        borderRadius: 8,
        background: 'var(--sof-topo-service-surface, #14161b)',
        border: `1px solid ${service.up === false ? '#e8555a4d' : '#ffffff14'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Tooltip label={`${service.name} — ${statusLabel}`} openDelay={300}>
        <div style={{ position: 'relative' }}>
          {iconFailed || !service.icon_slug ? (
            <IconApps size={16} color="#8a8f98" />
          ) : (
            <img
              src={`${ICON_BASE}/${service.icon_slug}.svg`}
              alt=""
              width={16}
              height={16}
              style={{ objectFit: 'contain' }}
              onError={() => setIconFailed(true)}
            />
          )}
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dotColor,
              border: '1px solid var(--sof-topo-service-surface, #14161b)',
            }}
          />
        </div>
      </Tooltip>
      <Text size="10px" truncate style={{ color: '#c4c7cd', maxWidth: '100%' }}>
        {service.name}
      </Text>

      {(service.internal_url || service.external_url) && (
        // "nodrag" (react-flow's own escape-hatch class) keeps these links
        // clickable instead of being swallowed by the node's own drag
        // handling; stopPropagation keeps a click from also selecting/
        // dragging the node underneath.
        <div className="nodrag" style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          {service.internal_url && (
            <Tooltip label="Open on LAN">
              <a
                href={service.internal_url}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                <IconHome2 size={12} />
              </a>
            </Tooltip>
          )}
          {service.external_url && (
            <Tooltip label="Open externally">
              <a
                href={service.external_url}
                target="_blank"
                rel="noreferrer"
                style={linkStyle}
              >
                <IconWorld size={12} />
              </a>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  )
}

const handleStyle = { opacity: 0, width: 1, height: 1 }
const linkStyle = { color: '#8a8f98', display: 'flex', cursor: 'pointer' }
