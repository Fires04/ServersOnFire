import { useEffect, useState } from 'react'
import { MantineProvider } from '@mantine/core'
import { buildTheme } from './theme'
import { THEMES, FALLBACK_THEME, isThemeName, type ThemeName } from './lib/themes'
import App from './App'

const STORAGE_KEY = 'sof-theme'

function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isThemeName(stored) ? stored : null
  } catch {
    // Private browsing / storage disabled — picker still works for this
    // session, it just won't remember across reloads.
    return null
  }
}

/** Owns the color theme: which one's active, persisting a manual pick, and
 * pushing the parts non-Mantine code needs (the topology canvas, the body
 * glow in index.css) out as CSS custom properties on the root element —
 * Mantine components re-theme via the `theme` prop below on their own. */
export default function Root() {
  const [themeName, setThemeName] = useState<ThemeName>(() => readStoredTheme() ?? FALLBACK_THEME)
  const [adoptedServerDefault, setAdoptedServerDefault] = useState(false)

  function changeTheme(name: ThemeName) {
    setThemeName(name)
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      // Ignore — see readStoredTheme.
    }
  }

  // Called once /api/data reports the server's DEFAULT_THEME. Only
  // adopted if this browser has never made its own explicit pick (checked
  // fresh, not from state, so a pick made *during* this same load still
  // wins) and only ever the first time a response comes back — a later
  // manual refresh shouldn't yank the theme back to the server default.
  function applyServerDefault(name: string) {
    if (adoptedServerDefault) return
    setAdoptedServerDefault(true)
    if (readStoredTheme() !== null) return
    if (isThemeName(name)) setThemeName(name)
  }

  useEffect(() => {
    const def = THEMES[themeName]
    const root = document.documentElement.style
    root.setProperty('--sof-glow', def.glow)
    root.setProperty('--sof-topo-bg', def.topoBg)
    root.setProperty('--sof-topo-surface', def.topoSurface)
    root.setProperty('--sof-topo-service-surface', def.topoServiceSurface)
  }, [themeName])

  return (
    <MantineProvider theme={buildTheme(themeName)} defaultColorScheme="auto">
      <App themeName={themeName} onThemeChange={changeTheme} onServerDefaultTheme={applyServerDefault} />
    </MantineProvider>
  )
}
