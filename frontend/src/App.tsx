import { useState, useEffect } from 'react'
import DoughnutChart from './components/DoughnutChart'
import DetailPanel from './components/DetailPanel'
import DrillDown from './components/DrillDown'
import Heatmap from './components/Heatmap'
import Outreach from './components/Outreach'
import AdminTable from './components/AdminTable'
import { fetchRegions, fetchDoughnut } from './api/client'
import type { RegionSummary, DoughnutData, Category } from './types'
import './app.css'

type View = 'doughnut' | 'drilldown' | 'heatmap' | 'outreach' | 'admin'

const LEGEND = [
  { color: '#4a8c1c', label: 'Under control' },
  { color: '#a8d65c', label: 'On track' },
  { color: '#f0c929', label: 'Needs attention' },
  { color: '#d63c36', label: 'Critical' },
  { color: '#8b0000', label: 'Severe' },
  { color: '#ccc', label: 'Unknown' },
]

const ADMIN_PW = 'doughnut2026'

export default function App() {
  const [view, setView] = useState<View>('doughnut')
  const [regions, setRegions] = useState<RegionSummary[]>([])
  const [currentSlug, setCurrentSlug] = useState<string | null>(null)
  const [data, setData] = useState<DoughnutData | null>(null)
  const [selected, setSelected] = useState<Category | null>(null)
  const [drilldownCat, setDrilldownCat] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('doughnut_admin') === '1')
  const [loginInput, setLoginInput] = useState('')
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    fetchRegions()
      .then((r) => {
        setRegions(r)
        if (r.length > 0) setCurrentSlug(r[0].slug)
        else setLoading(false)
      })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!currentSlug) return
    setLoading(true)
    setSelected(null)
    fetchDoughnut(currentSlug)
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [currentSlug])

  function handleExplore(cat: Category) {
    setDrilldownCat(cat)
    setView('drilldown')
  }

  function goHome() {
    setView('doughnut')
    setDrilldownCat(null)
  }

  function attemptLogin() {
    if (loginInput === ADMIN_PW) {
      setIsAdmin(true)
      sessionStorage.setItem('doughnut_admin', '1')
      setLoginError(false)
      setLoginInput('')
    } else {
      setLoginError(true)
      setLoginInput('')
    }
  }

  function logout() {
    setIsAdmin(false)
    sessionStorage.removeItem('doughnut_admin')
    if (view === 'admin') setView('doughnut')
  }

  return (
    <div className="app-shell">
      <header>
        <div className="header-left">
          <h1 style={{ cursor: 'pointer' }} onClick={goHome}>Doughnut Economics</h1>
          {data && <span className="header-region">{data.region.name}</span>}
        </div>
        <div className="header-right">
          <nav className="header-nav">
            <button className={`nav-pill ${view === 'doughnut' || view === 'drilldown' ? 'active' : ''}`} onClick={goHome}>
              Doughnut
            </button>
            <button className={`nav-pill ${view === 'heatmap' ? 'active' : ''}`} onClick={() => setView('heatmap')}>
              Data Quality
            </button>
            <button className={`nav-pill ${view === 'outreach' ? 'active' : ''}`} onClick={() => setView('outreach')}>
              Outreach
            </button>
            {isAdmin && (
              <button className={`nav-pill ${view === 'admin' ? 'active' : ''}`} onClick={() => setView('admin')}>
                Editor
              </button>
            )}
            {isAdmin ? (
              <button className="nav-pill" onClick={logout} style={{ opacity: 0.6 }}>Log out</button>
            ) : (
              <button className="nav-pill" onClick={() => setView('admin')}>Admin</button>
            )}
          </nav>
          {regions.length > 1 && (
            <div className="region-switcher">
              {regions.map((r) => (
                <button
                  key={r.slug}
                  className={`region-btn ${currentSlug === r.slug ? 'active' : ''}`}
                  onClick={() => { setCurrentSlug(r.slug); goHome() }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {error && <div className="error-msg">{error}</div>}

      {view === 'doughnut' && (
        <div className="main-layout">
          <div className="chart-pane">
            {loading && <div className="loading">Loading data...</div>}
            {data && !loading && (
              <>
                <DoughnutChart
                  social={data.social}
                  ecological={data.ecological}
                  onSelect={setSelected}
                />
                <div className="chart-footer">
                  <div className="chart-hint">Hover for details &bull; Click to expand</div>
                  <div className="legend">
                    {LEGEND.map((l) => (
                      <div key={l.label} className="legend-item">
                        <div className="legend-swatch" style={{ background: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="detail-panel">
            <DetailPanel category={selected} onExplore={handleExplore} />
          </div>
        </div>
      )}

      {view === 'drilldown' && drilldownCat && (
        <DrillDown category={drilldownCat} onBack={goHome} />
      )}

      {view === 'heatmap' && data && (
        <Heatmap data={data} onBack={goHome} />
      )}

      {view === 'outreach' && currentSlug && (
        <Outreach regionSlug={currentSlug} onBack={goHome} />
      )}

      {view === 'admin' && !isAdmin && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', width: 340, textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Admin Login</h2>
            <p style={{ color: '#636e72', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Enter the admin password to edit data</p>
            <input
              type="password"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && attemptLogin()}
              placeholder="Password"
              autoFocus
              style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '1rem', fontFamily: 'inherit', marginBottom: '0.75rem' }}
            />
            <button onClick={attemptLogin} style={{
              width: '100%', padding: '0.7rem', background: '#2d5016', color: 'white',
              border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Log In</button>
            {loginError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem' }}>Incorrect password.</p>}
          </div>
        </div>
      )}

      {view === 'admin' && isAdmin && data && (
        <div className="admin-view">
          <AdminTable data={data} onRefresh={() => currentSlug && fetchDoughnut(currentSlug).then(setData)} />
        </div>
      )}
    </div>
  )
}
