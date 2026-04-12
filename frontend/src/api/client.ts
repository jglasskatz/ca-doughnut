import type { RegionSummary, DoughnutData, Contact } from '../types'

/**
 * API client that works in two modes:
 * 1. Development: proxies to FastAPI backend at /api
 * 2. GitHub Pages: fetches pre-built static JSON from /api/*.json
 */

async function fetchJson<T>(path: string): Promise<T> {
  // Try the live API first
  const res = await fetch(path)
  if (res.ok) return res.json()

  // Fall back to static .json file (for GH Pages)
  const staticPath = path.endsWith('.json') ? path : path + '.json'
  const staticRes = await fetch(staticPath)
  if (staticRes.ok) return staticRes.json()

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
