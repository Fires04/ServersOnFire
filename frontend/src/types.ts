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

export interface Server {
  id: string
  kind: 'device' | 'vm'
  name: string
  status: string
  role: string
  site_name: string | null
  tenant_name: string | null
  primary_ip: string | null
  tags: string[]
  params: ServerParams
  services: Service[]
  backup: BackupInfo | null
}

export interface Dataset {
  generated_at: string
  servers: Server[]
}

export interface ApiData {
  dataset: Dataset | null
  last_error: string | null
}
