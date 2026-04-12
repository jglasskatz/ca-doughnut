import { useState, useRef } from 'react'
import type { DoughnutData, Category, Indicator } from '../types'

interface Props {
  data: DoughnutData
  onRefresh: () => void
}

interface FlatRow {
  category: Category
  indicator: Indicator
}

function flatten(data: DoughnutData): FlatRow[] {
  const rows: FlatRow[] = []
  for (const cat of [...data.social, ...data.ecological]) {
    for (const ind of cat.indicators) {
      rows.push({ category: cat, indicator: ind })
    }
  }
  return rows
}

export default function AdminTable({ data, onRefresh }: Props) {
  const [filter, setFilter] = useState<'all' | 'social' | 'ecological'>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  let rows = flatten(data)
  if (filter !== 'all') rows = rows.filter((r) => r.category.ring === filter)
  if (search) {
    const q = search.toLowerCase()
    rows = rows.filter(
      (r) =>
        r.category.name.toLowerCase().includes(q) ||
        r.indicator.name.toLowerCase().includes(q) ||
        (r.indicator.description || '').toLowerCase().includes(q)
    )
  }

  function startEdit(ind: Indicator, field: string) {
    setEditingId(ind.id)
    setEditField(field)
    setEditValue(String((ind as any)[field] ?? ''))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commitEdit() {
    if (editingId == null || !editField) return
    const body: Record<string, any> = {}
    if (editField === 'shortfall_pct' || editField === 'overshoot_pct' || editField === 'year') {
      body[editField] = editValue === '' ? null : Number(editValue)
    } else {
      body[editField] = editValue || null
    }
    await fetch(`/api/indicators/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setEditingId(null)
    setEditField(null)
    onRefresh()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') { setEditingId(null); setEditField(null) }
  }

  const editableFields = ['value', 'shortfall_pct', 'overshoot_pct', 'year', 'target', 'source', 'source_url', 'description']

  function renderCell(row: FlatRow, field: string) {
    const ind = row.indicator
    const val = (ind as any)[field]
    const isEditing = editingId === ind.id && editField === field
    const display = val != null ? String(val) : ''

    if (isEditing) {
      const isLong = field === 'description'
      return (
        <td className="editing">
          {isLong ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
            />
          )}
        </td>
      )
    }

    return (
      <td className="editable" onDoubleClick={() => startEdit(ind, field)}>
        {field === 'source_url' && val ? (
          <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: '#0984e3', fontSize: '0.8rem' }}>
            {val.length > 40 ? val.slice(0, 40) + '...' : val}
          </a>
        ) : field === 'description' ? (
          <div className="truncated">{display}</div>
        ) : (
          display || <span style={{ color: '#ccc' }}>—</span>
        )}
      </td>
    )
  }

  return (
    <div>
      <div className="admin-toolbar">
        <label>Filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">All ({flatten(data).length})</option>
          <option value="social">Social Foundation</option>
          <option value="ecological">Ecological Ceiling</option>
        </select>
        <input
          type="text"
          placeholder="Search indicators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span style={{ fontSize: '0.8rem', color: '#636e72' }}>
          Double-click any cell to edit &bull; {rows.length} indicators shown
        </span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ring</th>
              <th>Category</th>
              <th>Indicator</th>
              <th>Value</th>
              <th>Shortfall %</th>
              <th>Overshoot %</th>
              <th>Year</th>
              <th>Target</th>
              <th>Source</th>
              <th>Source URL</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.indicator.id}>
                <td>
                  <span className={`ring-badge ring-badge-${row.category.ring}`}>
                    {row.category.ring}
                  </span>
                </td>
                <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.category.name}</td>
                <td style={{ fontWeight: 500 }}>{row.indicator.name}</td>
                {renderCell(row, 'value')}
                {renderCell(row, 'shortfall_pct')}
                {renderCell(row, 'overshoot_pct')}
                {renderCell(row, 'year')}
                {renderCell(row, 'target')}
                {renderCell(row, 'source')}
                {renderCell(row, 'source_url')}
                {renderCell(row, 'description')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
