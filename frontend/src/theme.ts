import { createTheme } from '@mantine/core'
import { THEMES, type ThemeName } from './lib/themes'

/** Builds the Mantine theme for a given color theme — every `color="flame"`
 * reference elsewhere in the app stays as-is; only the 10-shade ramp
 * backing that key changes per theme (see lib/themes.ts).
 *
 * Typography matches the "Kindling" mockup's own pairing: JetBrains Mono
 * for headings (the wordmark, section titles — a display face with an
 * engineering-tool personality instead of a neutral system sans), IBM
 * Plex Sans for body text, IBM Plex Mono for tabular data. Loaded via
 * Google Fonts in index.html. */
export function buildTheme(name: ThemeName) {
  return createTheme({
    primaryColor: 'flame',
    colors: { flame: THEMES[name].flame, dark: THEMES[name].dark },
    defaultRadius: 'md',
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMonospace: '"IBM Plex Mono", "SFMono-Regular", Consolas, Menlo, monospace',
    headings: {
      fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, Menlo, monospace',
      fontWeight: '700',
    },
  })
}

// NetBox device/VM `status.value` -> badge color. Anything not listed here
// (custom statuses some instances add) falls back to gray rather than
// guessing. Deliberately independent of the color theme above — status
// meaning (active/offline/staged) stays constant no matter which accent
// is picked.
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
