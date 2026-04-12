import { useState, useEffect } from 'react'
import { fetchContacts } from '../api/client'
import type { Contact } from '../types'

interface Props {
  regionSlug: string
  onBack: () => void
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'priority', label: 'Priority Gaps' },
  { key: 'social', label: 'Social Foundation' },
  { key: 'ecological', label: 'Ecological Ceiling' },
  { key: 'cross', label: 'Cross-cutting' },
]

export default function Outreach({ regionSlug, onBack }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    fetchContacts(regionSlug).then(setContacts).catch(() => {})
  }, [regionSlug])

  const filtered = filter === 'all'
    ? contacts
    : contacts.filter((c) => c.tags.includes(filter))

  function copyDraft(contact: Contact) {
    if (contact.draft_message) {
      navigator.clipboard.writeText(contact.draft_message)
      setCopiedId(contact.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <button className="back-btn" onClick={onBack}>&larr; Back to Doughnut</button>

      <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Outreach Directory</h2>
      <p style={{ fontSize: '0.88rem', color: '#636e72', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Contacts and organizations that can help fill data gaps. Click a card to see details, data needs, and a draft outreach message.
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '0.35rem 0.8rem',
              border: `1px solid ${filter === f.key ? '#2d5016' : '#dfe6e9'}`,
              borderRadius: '2rem',
              background: filter === f.key ? '#2d5016' : 'white',
              color: filter === f.key ? 'white' : '#636e72',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#b2bec3' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No outreach contacts yet</p>
          <p style={{ fontSize: '0.85rem' }}>
            Add contacts via the API: <code style={{ background: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.8rem' }}>
              POST /api/regions/{regionSlug}/contacts
            </code>
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem' }}>
            Each contact needs: org, person, tags, data_needs, why, and optionally a draft_message.
          </p>
        </div>
      )}

      {/* Contact cards */}
      {filtered.map((c) => {
        const isOpen = expanded === c.id
        return (
          <div key={c.id} style={{
            background: 'white', borderRadius: '0.75rem', marginBottom: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div
              onClick={() => setExpanded(isOpen ? null : c.id)}
              style={{
                padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', borderBottom: isOpen ? '1px solid #f1f3f5' : 'none',
              }}
            >
              <span style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: '#b2bec3' }}>
                ▶
              </span>
              <span style={{ fontWeight: 700, flex: 1 }}>{c.org}</span>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {c.tags.map((t) => (
                  <span key={t} style={{
                    padding: '0.1rem 0.4rem', borderRadius: 4,
                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
                    background: t === 'priority' ? '#d63031' : t === 'social' ? '#dfe6dc' : t === 'ecological' ? '#ffcdd2' : '#e8eaf6',
                    color: t === 'priority' ? 'white' : t === 'social' ? '#2d5016' : t === 'ecological' ? '#6b1a0e' : '#283593',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Body */}
            {isOpen && (
              <div style={{ padding: '1rem 1.25rem' }}>
                {/* Contact info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {c.person && <div><strong style={{ color: '#636e72' }}>Contact:</strong> {c.person}</div>}
                  {c.phone && <div><strong style={{ color: '#636e72' }}>Phone:</strong> {c.phone}</div>}
                  {c.email && <div><strong style={{ color: '#636e72' }}>Email:</strong> <a href={`mailto:${c.email}`} style={{ color: '#0984e3' }}>{c.email}</a></div>}
                  {c.website && <div><strong style={{ color: '#636e72' }}>Web:</strong> <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: '#0984e3' }}>{c.website}</a></div>}
                  {c.address && <div><strong style={{ color: '#636e72' }}>Address:</strong> {c.address}</div>}
                </div>

                {/* Data needs */}
                {c.data_needs.length > 0 && (
                  <div style={{ background: '#fff3cd', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.78rem', color: '#6c5c00', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Data We Need</h4>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#6c5c00' }}>
                      {c.data_needs.map((n, i) => <li key={i} style={{ marginBottom: '0.2rem' }}>{n}</li>)}
                    </ul>
                  </div>
                )}

                {/* Why */}
                {c.why && (
                  <p style={{ fontSize: '0.85rem', color: '#636e72', marginBottom: '1rem', lineHeight: 1.5 }}>{c.why}</p>
                )}

                {/* Draft message */}
                {c.draft_message && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '0.78rem', color: '#2d5016', textTransform: 'uppercase' }}>Draft Message</h4>
                      <button
                        onClick={() => copyDraft(c)}
                        style={{
                          padding: '0.15rem 0.5rem', border: '1px solid #dfe6e9', borderRadius: 4,
                          background: copiedId === c.id ? '#2d5016' : 'white',
                          color: copiedId === c.id ? 'white' : '#636e72',
                          fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {copiedId === c.id ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre style={{
                      background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '0.5rem',
                      padding: '1rem', fontSize: '0.82rem', whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit', lineHeight: 1.5, color: '#2d3436',
                    }}>
                      {c.draft_message}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
