import type { DoughnutData, Category, Indicator } from '../types'

interface Props {
  data: DoughnutData
  onBack: () => void
}

interface Assessment {
  category: string
  ring: string
  status: 'complete' | 'partial' | 'missing'
  issues: string[]
  indicators: {
    name: string
    status: 'complete' | 'partial' | 'missing'
    issues: string[]
  }[]
}

function assessIndicator(ind: Indicator, ring: string): { status: 'complete' | 'partial' | 'missing'; issues: string[] } {
  const issues: string[] = []
  const pct = ring === 'social' ? ind.shortfall_pct : ind.overshoot_pct

  if (!ind.value || ind.value === 'Data pending' || ind.value === '—') issues.push('no value')
  if (pct == null) issues.push('no score')
  if (!ind.year) issues.push('no year')
  if (!ind.source) issues.push('no source')
  if (!ind.source_url) issues.push('no source URL')
  if (!ind.target) issues.push('no target')
  if (!ind.description) issues.push('no description')

  if (issues.includes('no value') || issues.includes('no score')) return { status: 'missing', issues }
  if (issues.length === 0) return { status: 'complete', issues }
  return { status: 'partial', issues }
}

function assessCategory(cat: Category): Assessment {
  const inds = cat.indicators.map((ind) => {
    const a = assessIndicator(ind, cat.ring)
    return { name: ind.name, ...a }
  })
  const allIssues = inds.flatMap((i) => i.issues)
  const hasComplete = inds.some((i) => i.status === 'complete')
  const hasMissing = inds.some((i) => i.status === 'missing')

  let status: Assessment['status'] = 'partial'
  if (inds.every((i) => i.status === 'complete')) status = 'complete'
  else if (inds.every((i) => i.status === 'missing')) status = 'missing'

  return { category: cat.name, ring: cat.ring, status, issues: [...new Set(allIssues)], indicators: inds }
}

export default function Heatmap({ data, onBack }: Props) {
  const allCats = [...data.social, ...data.ecological]
  const assessments = allCats.map(assessCategory)

  const total = assessments.length
  const complete = assessments.filter((a) => a.status === 'complete').length
  const partial = assessments.filter((a) => a.status === 'partial').length
  const missing = assessments.filter((a) => a.status === 'missing').length

  const totalInd = allCats.reduce((n, c) => n + c.indicators.length, 0)
  const completeInd = allCats.reduce((n, c) => n + c.indicators.filter((i) => assessIndicator(i, c.ring).status === 'complete').length, 0)
  const coverage = totalInd > 0 ? Math.round((completeInd / totalInd) * 100) : 0

  return (
    <div className="heatmap-page">
      <button className="back-btn" onClick={onBack}>&larr; Back to Doughnut</button>
      <h2>Data Completeness</h2>

      <div className="heatmap-summary">
        <div className="summary-card">
          <div className="num">{totalInd}</div>
          <div className="lbl">Total Indicators</div>
        </div>
        <div className="summary-card">
          <div className="num" style={{ color: '#2d5016' }}>{completeInd}</div>
          <div className="lbl">Complete</div>
        </div>
        <div className="summary-card">
          <div className="num" style={{ color: '#6c5c00' }}>{totalInd - completeInd - missing * 2}</div>
          <div className="lbl">Partial</div>
        </div>
        <div className="summary-card">
          <div className="num" style={{ color: '#6b1a0e' }}>{totalInd - completeInd - (totalInd - completeInd - missing * 2)}</div>
          <div className="lbl">Missing</div>
        </div>
        <div className="summary-card">
          <div className="num" style={{ color: '#4a8c1c' }}>{coverage}%</div>
          <div className="lbl">Coverage</div>
        </div>
      </div>

      <table className="heatmap-table">
        <thead>
          <tr>
            <th>Ring</th>
            <th>Category</th>
            <th>Status</th>
            <th>Indicator</th>
            <th>Value</th>
            <th>Score</th>
            <th>Year</th>
            <th>Source</th>
            <th>Issues</th>
          </tr>
        </thead>
        <tbody>
          {assessments.flatMap((a) =>
            a.indicators.map((ind, idx) => {
              const cat = allCats.find((c) => c.name === a.category)!
              const fullInd = cat.indicators[idx]
              const pct = cat.ring === 'social' ? fullInd.shortfall_pct : fullInd.overshoot_pct
              return (
                <tr key={`${a.category}-${ind.name}`}>
                  <td>
                    <span className={`ring-badge ring-badge-${a.ring}`}>{a.ring}</span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{a.category}</td>
                  <td>
                    <span className={`cell-${ind.status}`} style={{ padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                      {ind.status}
                    </span>
                  </td>
                  <td>{ind.name}</td>
                  <td>{fullInd.value || '—'}</td>
                  <td>{pct != null ? `${pct}%` : '—'}</td>
                  <td>{fullInd.year || '—'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{fullInd.source || '—'}</td>
                  <td style={{ fontSize: '0.72rem', color: '#636e72' }}>
                    {ind.issues.length > 0 ? ind.issues.join(', ') : '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
