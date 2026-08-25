// dashboard-icons CDN base, shared by every place that renders a service or
// platform icon from `icon_slug` (ServerIcon, ServiceRow, ServiceTile,
// topology's ServiceNode) — was duplicated per-file before.
export const ICON_BASE = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

/** Resolves a QuickLink's freeform `icon` field: a bare word ("netbox") is
 * a dashboard-icons slug like everywhere else in the app, but quicklinks
 * point at arbitrary external projects that don't have one — so a full
 * URL (including a data: URI) is passed through as-is, letting someone
 * use a logo that isn't in that public icon set at all. */
export function quickLinkIconSrc(icon: string | undefined | null): string | null {
  if (!icon) return null
  if (/^https?:\/\//i.test(icon) || icon.startsWith('data:')) return icon
  return `${ICON_BASE}/${icon}.svg`
}
