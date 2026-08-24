import { useState } from 'react'
import { ThemeIcon } from '@mantine/core'
import { IconServer, IconServer2 } from '@tabler/icons-react'
import type { Server } from '../types'

const ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

/** Same img-with-onError-fallback pattern as ServiceRow's icon — a guessed
 * platform slug that doesn't exist in dashboard-icons degrades to the
 * generic device/VM icon instead of a broken image.
 *
 * A real logo is rendered bare (no colored circle behind it) — most
 * dashboard-icons SVGs already carry their own brand-colored background
 * (Proxmox's orange square, etc.), so wrapping them in the flame-tinted
 * ThemeIcon doubled up into a clashing icon-on-a-different-colored-box
 * look. The tinted circle is reserved for the generic fallback icon,
 * which has no color of its own. */
export default function ServerIcon({ server, size = 28 }: { server: Server; size?: number }) {
  const [failed, setFailed] = useState(false)
  const showImage = server.icon_slug && !failed

  if (showImage) {
    return (
      <img
        src={`${ICON_BASE}/${server.icon_slug}.svg`}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', flexShrink: 0, borderRadius: 6 }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <ThemeIcon size={size} radius="md" variant="light" color="flame">
      {server.kind === 'device' ? (
        <IconServer2 size={Math.round(size * 0.55)} />
      ) : (
        <IconServer size={Math.round(size * 0.55)} />
      )}
    </ThemeIcon>
  )
}
