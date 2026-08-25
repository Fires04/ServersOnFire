/** Trimmed fetch helper: same-origin cookies, redirect to /login on 401.
 * No JWT/CSRF machinery — that's overkill for a cookie-session,
 * single-operator dashboard (see FiresLog's lib/api.ts for the fuller
 * version this is trimmed from). */
import type { ApiData, QuickLink } from '../types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(path, { ...init, credentials: 'include' })

  if (resp.status === 401) {
    window.location.href = '/login'
    return new Promise<T>(() => {}) // navigation is in flight; never resolve
  }

  const isJson = resp.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await resp.json().catch(() => null) : null

  if (!resp.ok) {
    const message =
      (data && typeof data === 'object' && 'detail' in data && String((data as { detail: unknown }).detail)) ||
      resp.statusText
    throw new ApiError(resp.status, message)
  }
  return data as T
}

export const api = {
  data: () => apiFetch<ApiData>('/api/data'),
  refresh: () => apiFetch<ApiData>('/api/refresh', { method: 'POST' }),
  quicklinks: () => apiFetch<QuickLink[]>('/api/quicklinks'),
  saveQuicklinks: (links: QuickLink[]) =>
    apiFetch<QuickLink[]>('/api/quicklinks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(links),
    }),
}
