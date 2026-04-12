import { useRef, useEffect, useId } from 'react'
import { D3Doughnut } from '../lib/d3-doughnut.js'
import type { Category, DoughnutData } from '../types'

interface Props {
  social: Category[]
  ecological: Category[]
  onSelect: (category: Category | null) => void
}

/**
 * Convert shortfall/overshoot % into the `level` scale (-100 to 150) that
 * the D3Doughnut class uses for segment sizing and coloring.
 *
 * Social shortfall:
 *   0% → -100,  10% → -50,  25% → 0,  50% → 50,  75% → 100,  100%+ → 125-150
 *
 * Ecological overshoot (uses log scale for huge values like 1890%):
 *   0% → -100,  25% → 0,  50% → 25,  100% → 50,  500% → 100,  1000%+ → 125-150
 */
function shortfallToLevel(pct: number | null): number | null {
  if (pct == null) return null
  if (pct <= 0) return -100
  // Linear map: 0% → -100, 100% → 100
  return Math.min(150, pct * 2 - 100)
}

function overshootToLevel(pct: number | null): number | null {
  if (pct == null) return null
  if (pct <= 0) return -100
  // Use log scale for ecological overshoot since values range from 0% to 1890%
  // log2(1) = 0, log2(100) ≈ 6.6, log2(1000) ≈ 10
  const logVal = Math.log2(1 + pct) // 0% → 0, 100% → 6.6, 1000% → 10
  const level = (logVal / 11) * 250 - 100 // map to -100..150
  return Math.min(150, Math.max(-100, level))
}

function categoryToDimension(cat: Category, ring: 'social' | 'ecological') {
  const isSocial = ring === 'social'
  const pcts = cat.indicators
    .map((i) => (isSocial ? i.shortfall_pct : i.overshoot_pct))
    .filter((v): v is number => v != null)
  const avgPct = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null

  const level = isSocial ? shortfallToLevel(avgPct) : overshootToLevel(avgPct)

  // Build tooltip strings
  const indicatorSummary = cat.indicators.map((i) => i.name).join(', ')
  const valueSummary = cat.indicators.map((i) => {
    const p = isSocial ? i.shortfall_pct : i.overshoot_pct
    return `${i.name}: ${p != null ? p + '%' : 'N/A'}`
  }).join(' | ')

  return {
    name: cat.name,
    level,
    indicator: indicatorSummary,
    value: valueSummary,
    year: cat.indicators[0]?.year,
    source: cat.indicators.map((i) => i.source).filter(Boolean).join('; '),
    _category: cat,
  }
}

export default function DoughnutChart({ social, ecological, onSelect }: Props) {
  const containerId = useId().replace(/:/g, '_') + '_doughnut'
  const doughnutRef = useRef<InstanceType<typeof D3Doughnut> | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Build a lookup from dimension name → Category
  const catLookup = useRef(new Map<string, Category>())

  useEffect(() => {
    // Build the data in the format D3Doughnut expects
    const lookup = new Map<string, Category>()
    const socialDims = social.map((c) => {
      const dim = categoryToDimension(c, 'social')
      lookup.set(c.name, c)
      return dim
    })
    const ecoDims = ecological.map((c) => {
      const dim = categoryToDimension(c, 'ecological')
      lookup.set(c.name, c)
      return dim
    })
    catLookup.current = lookup

    if (!doughnutRef.current) {
      doughnutRef.current = new D3Doughnut(containerId, {
        onSelect: (dim: any) => {
          if (dim) {
            const cat = catLookup.current.get(dim.name)
            onSelectRef.current(cat || null)
          } else {
            onSelectRef.current(null)
          }
        },
      })
    }

    doughnutRef.current.setData({ social: socialDims, ecological: ecoDims })
  }, [social, ecological, containerId])

  return (
    <div
      id={containerId}
      style={{ position: 'relative', width: '100%', maxWidth: 'calc(100vh - 36px)', margin: '0 auto' }}
    />
  )
}
