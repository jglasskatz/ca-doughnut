export interface Indicator {
  id: number
  name: string
  description: string | null
  value: string | null
  unit: string | null
  year: number | null
  shortfall_pct: number | null
  overshoot_pct: number | null
  target: string | null
  source: string | null
  source_url: string | null
}

export interface Category {
  id: number
  slug: string
  name: string
  ring: 'social' | 'ecological'
  icon: string | null
  description: string | null
  context: string | null
  policy_spotlight: string | null
  justice_spotlight: string | null
  actions: string[]
  indicators: Indicator[]
}

export interface RegionSummary {
  id: number
  slug: string
  name: string
  region_type: string
  population: string | null
  description: string | null
}

export interface DoughnutData {
  region: RegionSummary
  social: Category[]
  ecological: Category[]
}

export interface Contact {
  id: number
  org: string
  person: string | null
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  tags: string[]
  data_needs: string[]
  why: string | null
  draft_message: string | null
}
