import type { MantineColorsTuple } from '@mantine/core'

export type ThemeName = 'signal' | 'aurora' | 'copper' | 'slate'

export const THEME_NAMES: ThemeName[] = ['signal', 'aurora', 'copper', 'slate']

export interface ThemeDef {
  label: string
  /** Registered under Mantine's "flame" color key (see theme.ts) — every
   * existing `color="flame"` reference in the app keeps working unchanged,
   * it's just backed by a different 10-shade ramp per theme. */
  flame: MantineColorsTuple
  /** Low-alpha accent used for index.css's body background glow. */
  glow: string
  /** Topology view keeps its own fixed dark canvas regardless of the app's
   * light/dark setting (see TopologyView's comment) — these three still
   * shift per color theme so the map matches whichever identity is picked
   * app-wide, rather than being the one place stuck on the old palette. */
  topoBg: string
  topoSurface: string
  topoServiceSurface: string
  /** Single hex for the picker's own swatch dot. */
  swatch: string
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  signal: {
    label: 'Signal',
    flame: [
      '#eaf9ff',
      '#cdf1ff',
      '#a3e5fc',
      '#79d8f6',
      '#57ccf1',
      '#35c5f0',
      '#1fb1de',
      '#1494c4',
      '#0f77a1',
      '#0a5c7e',
    ],
    glow: 'rgba(53, 197, 240, 0.16)',
    topoBg: '#0a0e16',
    topoSurface: '#141b2c',
    topoServiceSurface: '#0e1420',
    swatch: '#35c5f0',
  },
  aurora: {
    label: 'Aurora',
    flame: [
      '#f4eeff',
      '#e6d9ff',
      '#cfb4ff',
      '#b790ff',
      '#a67cff',
      '#9d6bff',
      '#8a55f0',
      '#7440d6',
      '#5f30b0',
      '#4a2389',
    ],
    glow: 'rgba(157, 107, 255, 0.16)',
    topoBg: '#0e0b1a',
    topoSurface: '#1a1530',
    topoServiceSurface: '#120e1f',
    swatch: '#9d6bff',
  },
  copper: {
    label: 'Copper',
    flame: [
      '#fbf0e6',
      '#f3ddc4',
      '#e8c299',
      '#dda872',
      '#d4934f',
      '#d68a4c',
      '#c67736',
      '#a95f28',
      '#8a4b1f',
      '#6c3a18',
    ],
    glow: 'rgba(214, 138, 76, 0.16)',
    topoBg: '#151109',
    topoSurface: '#221a10',
    topoServiceSurface: '#1a140d',
    swatch: '#d68a4c',
  },
  slate: {
    label: 'Slate',
    flame: [
      '#eef1ff',
      '#dbe1ff',
      '#b7c3fe',
      '#93a5fd',
      '#7890fb',
      '#5b7cfa',
      '#4863e8',
      '#3a4fc7',
      '#2f3fa0',
      '#25317c',
    ],
    glow: 'rgba(91, 124, 250, 0.16)',
    topoBg: '#101114',
    topoSurface: '#1c1e24',
    topoServiceSurface: '#131417',
    swatch: '#5b7cfa',
  },
}

/** Used when no `.env` DEFAULT_THEME, no saved local pick, and (briefly,
 * before /api/data answers) no server default has arrived yet — closest
 * in hue to the app's original orange "flame" identity, so a first paint
 * before any of that resolves doesn't jump colors twice. */
export const FALLBACK_THEME: ThemeName = 'copper'

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return !!value && (THEME_NAMES as string[]).includes(value)
}
