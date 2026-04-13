import type { RegionSummary, DoughnutData, Contact } from '../types'

const BASE_URL = import.meta.env.BASE_URL || '/'

async function fetchJson<T>(path: string): Promise<T> {
  // Try static .json file first (works on both GH Pages and dev with proxy)
  const staticPath = BASE_URL + path.replace(/^\//, '') + '.json'
  const staticRes = await fetch(staticPath)
  if (staticRes.ok) {
    const ct = staticRes.headers.get('content-type') || ''
    if (ct.includes('json')) return staticRes.json()
  }

  // Fall back to live API (dev mode with backend proxy)
  const res = await fetch(path)
  if (res.ok) return res.json()

  throw new Error(`Failed to fetch ${path}: ${res.status}`)
}

export async function fetchRegions(): Promise<RegionSummary[]> {
  return fetchJson('/api/regions')
}

export async function fetchDoughnut(slug: string): Promise<DoughnutData> {
  return fetchJson(`/api/regions/${slug}/doughnut`)
}

export async function fetchContacts(slug: string): Promise<Contact[]> {
  return fetchJson(`/api/regions/${slug}/contacts`)
}
