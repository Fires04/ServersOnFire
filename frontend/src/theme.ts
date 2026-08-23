import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Same "flame" brand accent as FiresLog (#d1451f / dark #ff6a3d) — copied
// verbatim from FiresLog/frontend/src/theme.ts so the two dashboards look
// like one family.
const flame: MantineColorsTuple = [
  '#fff2ee',
  '#ffe0d4',
  '#ffbfa8',
  '#ff9a78',
  '#ff7a50',
  '#ff6a3d',
  '#f5602f',
  '#d1451f',
  '#b83a19',
  '#9c2f12',
]

export const theme = createTheme({
  primaryColor: 'flame',
  colors: { flame },
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace:
    "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  headings: { fontWeight: '700' },
})

// NetBox device/VM `status.value` -> badge color. Anything not listed here
// (custom statuses some instances add) falls back to gray rather than
// guessing.
const DEVICE_STATUS_COLOR: Record<string, string> = {
  active: 'teal',
  staged: 'yellow',
  planned: 'yellow',
  offline: 'red',
  failed: 'red',
  decommissioning: 'gray',
  deprecated: 'gray',
  inventory: 'gray',
}

export function serverStatusColor(status: string): string {
  return DEVICE_STATUS_COLOR[status] ?? 'gray'
}

// A service's `up` is a tri-state: true/false from the last health probe,
// or null when it was never checked (no internal/external URL configured).
export function serviceStatusColor(up: boolean | null): string {
  if (up === null) return 'gray'
  return up ? 'teal' : 'red'
}
