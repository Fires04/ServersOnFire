import { useState } from 'react'
import { ThemeIcon } from '@mantine/core'
import { IconServer, IconServer2 } from '@tabler/icons-react'
import type { Server } from '../types'

const ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

/** Same img-with-onError-fallback pattern as ServiceRow's icon — a guessed
 * platform slug that doesn't exist in dashboard-icons degrades to the
 * generic device/VM icon instead of a broken image. */
export default function ServerIcon({ server, size = 28 }: { server: Server; size?: number }) {
  const [failed, setFailed] = useState(false)
  const showImage = server.icon_slug && !failed

  return (
    <ThemeIcon size={size} radius="md" variant="light" color="flame">
      {showImage ? (
        <img
          src={`${ICON_BASE}/${server.icon_slug}.svg`}
          alt=""
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          style={{ objectFit: 'contain' }}
          onError={() => setFailed(true)}
        />
      ) : server.kind === 'device' ? (
        <IconServer2 size={Math.round(size * 0.55)} />
      ) : (
        <IconServer size={Math.round(size * 0.55)} />
      )}
    </ThemeIcon>
  )
}
