import type { Category, Indicator } from '../types'

interface Props {
  category: Category | null
  onExplore: (category: Category) => void
}

function avgPct(cat: Category): number | null {
  const isSocial = cat.ring === 'social'
  const vals = cat.indicators
    .map((i) => (isSocial ? i.shortfall_pct : i.overshoot_pct))
    .filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function statusClass(pct: number | null): string {
  if (pct == null) return 'status-unknown'
  if (pct <= 0) return 'status-good'
  if (pct <= 5) return 'status-ok'
  if (pct <= 20) return 'status-moderate'
  if (pct <= 50) return 'status-caution'
  if (pct <= 100) return 'status-bad'
  return 'status-severe'
}

function statusLabel(pct: number | null): string {
  if (pct == null) return 'Unknown'
  if (pct <= 0) return 'No problem'
  if (pct <= 5) return 'On track'
  if (pct <= 20) return 'Moderate'
  if (pct <= 50) return 'Needs attention'
  if (pct <= 100) return 'Critical'
  return 'Severe'
}

function severityBarColor(pct: number): string {
  if (pct <= 5) return '#4a8c1c'
  if (pct <= 20) return '#a8d65c'
  if (pct <= 50) return '#f0c929'
  if (pct <= 100) return '#e17055'
  return '#d63031'
}

export default function DetailPanel({ category, onExplore }: Props) {
  if (!category) {
    return (
      <div className="detail-empty">
        Select a dimension on the doughnut to explore data, primary sources, and ways to take action.
      </div>
    )
  }

  const isSocial = category.ring === 'social'
  const pct = avgPct(category)
  const barWidth = pct != null ? Math.min(100, Math.max(2, pct / 2)) : 0

  return (
    <div className="detail-content">
      <div className="detail-header">
        <span className={`detail-ring ${isSocial ? 'ring-social' : 'ring-ecological'}`} />
        <h3>{category.name}</h3>
        <span className={`detail-status ${statusClass(pct)}`}>{statusLabel(pct)}</span>
      </div>

      {pct != null && (
        <div className="severity-bar">
          <div className="severity-bar-fill" style={{ width: `${barWidth}%`, background: severityBarColor(pct) }} />
        </div>
      )}

      {category.description && (
        <p style={{ fontSize: '0.82rem', color: '#636e72', marginBottom: '0.75rem', lineHeight: 1.4 }}>
          {category.description}
        </p>
      )}

      {category.indicators.map((ind) => {
        const iPct = isSocial ? ind.shortfall_pct : ind.overshoot_pct
        return (
          <div key={ind.id} className="detail-metric">
            <div className="label">{ind.name}</div>
            <div className="value">{ind.value || 'Data needed'}</div>
            {ind.year && <div className="year">Year: {ind.year}</div>}
            {ind.target && <div className="target">Target: {ind.target}</div>}
            {iPct != null && (
              <div style={{ fontSize: '0.75rem', color: '#636e72', marginTop: '0.2rem' }}>
                {isSocial ? 'Shortfall' : 'Overshoot'}: <strong>{iPct}%</strong>
              </div>
            )}
            {ind.source && (
              <div style={{ fontSize: '0.72rem', color: '#b2bec3', marginTop: '0.2rem' }}>
                {ind.source_url ? (
                  <a href={ind.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0984e3', textDecoration: 'none' }}>
                    {ind.source}
                  </a>
                ) : ind.source}
              </div>
            )}
          </div>
        )
      })}

      {category.policy_spotlight && (
        <div className="detail-spotlight spotlight-policy">
          <h4>Policy Spotlight</h4>
          <p>{category.policy_spotlight}</p>
        </div>
      )}

      {category.justice_spotlight && (
        <div className="detail-spotlight spotlight-justice">
          <h4>Justice Spotlight</h4>
          <p>{category.justice_spotlight}</p>
        </div>
      )}

      {category.actions && category.actions.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <h4 style={{ fontSize: '0.75rem', color: '#2d5016', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            Ways to Get Involved
          </h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {category.actions.map((a, i) => (
              <li key={i} style={{ padding: '0.35rem 0', borderBottom: '1px solid #f1f3f5', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.4 }}>
                <span style={{ color: '#4a8c1c', fontWeight: 'bold', flexShrink: 0 }}>&rarr;</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="explore-btn" onClick={() => onExplore(category)}>
        Explore {category.name} &rarr;
      </button>
    </div>
  )
}
