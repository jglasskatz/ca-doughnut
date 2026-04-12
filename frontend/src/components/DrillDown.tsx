import type { Category } from '../types'

interface Props {
  category: Category
  onBack: () => void
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

export default function DrillDown({ category, onBack }: Props) {
  const isSocial = category.ring === 'social'
  const pctLabel = isSocial ? 'shortfall' : 'overshoot'

  return (
    <div className="drilldown">
      <button className="back-btn" onClick={onBack}>&larr; Back to Doughnut</button>

      <div className="drilldown-header">
        <span className={`detail-ring ${isSocial ? 'ring-social' : 'ring-ecological'}`}
              style={{ width: 18, height: 18 }} />
        <h2>{category.name}</h2>
        <span style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'capitalize' }}>
          {category.ring} {isSocial ? 'Foundation' : 'Ceiling'}
        </span>
      </div>

      {category.description && (
        <p className="drilldown-description">{category.description}</p>
      )}

      <h3 style={{ fontSize: '1rem', color: '#374151', marginBottom: '1rem' }}>Indicators</h3>
      <div className="drilldown-grid">
        {category.indicators.map((ind) => {
          const pct = isSocial ? ind.shortfall_pct : ind.overshoot_pct
          return (
            <div key={ind.id} className="indicator-card-lg">
              <h4>{ind.name}</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.3rem' }}>
                <span className="big-value">{ind.value || '—'}</span>
                {pct != null && (
                  <span className={`pct-badge ${statusClass(pct)}`}>
                    {pct}% {pctLabel}
                  </span>
                )}
              </div>
              {ind.description && <div className="desc">{ind.description}</div>}
              {ind.target && (
                <div style={{ fontSize: '0.85rem', color: '#6c5ce7', marginTop: '0.5rem' }}>
                  Target: {ind.target}
                </div>
              )}
              <div className="meta">
                {ind.year && <span>Year: {ind.year}</span>}
                {ind.source && (
                  <>
                    {ind.year && <span> &bull; </span>}
                    Source:{' '}
                    {ind.source_url ? (
                      <a href={ind.source_url} target="_blank" rel="noopener noreferrer">{ind.source}</a>
                    ) : (
                      ind.source
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {category.policy_spotlight && (
        <div className="detail-spotlight spotlight-policy" style={{ marginBottom: '1rem' }}>
          <h4>Policy Spotlight</h4>
          <p>{category.policy_spotlight}</p>
        </div>
      )}

      {category.justice_spotlight && (
        <div className="detail-spotlight spotlight-justice" style={{ marginBottom: '1rem' }}>
          <h4>Justice Spotlight</h4>
          <p>{category.justice_spotlight}</p>
        </div>
      )}

      {category.actions && category.actions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#2d5016', marginBottom: '0.75rem' }}>Ways to Get Involved</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {category.actions.map((a, i) => (
              <li key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f3f5', fontSize: '0.95rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5 }}>
                <span style={{ color: '#4a8c1c', fontWeight: 'bold', flexShrink: 0 }}>&rarr;</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {category.context && (
        <div className="detail-spotlight spotlight-context" style={{ marginBottom: '1rem' }}>
          <h4>Context</h4>
          <p>{category.context}</p>
        </div>
      )}
    </div>
  )
}
