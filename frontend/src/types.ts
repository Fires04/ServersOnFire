// Mirrors backend/app/dataset.py's output shape 1:1 — see that module's
// docstring for where each field comes from in NetBox.

export interface Service {
  name: string
  ports: number[]
  protocol: string
  internal_url: string
  external_url: string
  icon_slug: string
  up: boolean | null
}

export interface BackupInfo {
  method: string | null
  target_name: string | null
  path: string | null
}

export interface ServerParams {
  device_type?: string
  platform?: string
  cluster?: string
  hypervisor?: string
  vcpus?: number
  memory_mb?: number
  disk_gb?: number
}

export interface Tag {
  name: string
  /** 6-hex-digit NetBox tag color, no leading '#' (empty string if unset). */
  color: string
}

export interface Server {
  id: string
  kind: 'device' | 'vm'
  name: string
  status: string
  role: string
  site_name: string | null
  tenant_name: string | null
  primary_ip: string | null
  tags: Tag[]
  params: ServerParams
  services: Service[]
  backup: BackupInfo | null
  /** Best-effort dashboard-icons slug derived from the platform name, or
   * null if there's no platform to guess from. May not resolve to a real
   * icon — always render with a fallback (see ServerIcon.tsx). */
  icon_slug: string | null
}

export interface Dataset {
  generated_at: string
  servers: Server[]
}

/** One entry in the hand-edited data/quicklinks.json — external projects
 * that aren't NetBox inventory (see HelpPanel). `icon` is a dashboard-icons
 * slug, same convention as Service.icon_slug. `order` is optional; entries
 * without it sort after ones that have it, by array position. */
export interface QuickLink {
  name: string
  url: string
  icon?: string
  order?: number
}

export interface ApiData {
  dataset: Dataset | null
  last_error: string | null
  /** NetBox tag (config.DISPLAY_TAG) that a device/VM must carry to show up
   * here at all — surfaced so HelpPanel's cheatsheet stays correct even if
   * an instance overrides the default. */
  display_tag: string
  /** config.DEFAULT_THEME — adopted client-side only if this browser
   * hasn't already picked its own color theme (see Root.tsx). */
  default_theme: string
}
