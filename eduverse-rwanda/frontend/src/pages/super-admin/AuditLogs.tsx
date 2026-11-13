import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Search, Shield, ClipboardList, Download, Filter } from 'lucide-react'
import { format } from 'date-fns'

const levelColors: Record<string, string> = {
  info:    'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  error:   'bg-red-100 text-red-600',
}

export default function SuperAuditLogs() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [applied, setApplied] = useState({ search: '', from: '', to: '' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', applied],
    queryFn: () => {
      const params = new URLSearchParams()
      if (applied.search) params.set('search', applied.search)
      if (applied.from)   params.set('from', applied.from)
      if (applied.to)     params.set('to', applied.to)
      return api.get(`/audit-logs?${params}`).then(r => r.data.data || [])
    },
    retry: false,
  })

  const logs: any[] = (data || []).filter((l: any) =>
    level === 'all' || l.level === level
  )

  const handleApply = () => setApplied({ search, from, to })

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (applied.from) params.set('from', applied.from)
    if (applied.to)   params.set('to', applied.to)
    const token = localStorage.getItem('token')
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/audit-logs/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'audit-logs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="text-sm text-gray-500">Track all system activities and user actions</p>
        </div>
        <button onClick={handleExport} className="btn-secondary gap-2">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApply()} placeholder="Search action, resource, user..." className="input pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-36" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input w-36" />
          </div>
          <button onClick={handleApply} className="btn-primary gap-2">
            <Filter size={14} /> Apply
          </button>
          {(applied.search || applied.from || applied.to) && (
            <button onClick={() => { setSearch(''); setFrom(''); setTo(''); setApplied({ search: '', from: '', to: '' }) }} className="btn-secondary text-xs">Clear</button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'info', 'success', 'warning', 'error'].map(l => (
            <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${level === l ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <ClipboardList size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-400">{logs.length} record{logs.length !== 1 ? 's' : ''}</div>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Action</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Resource</th>
                  <th className="table-header">Details</th>
                  <th className="table-header">IP</th>
                  <th className="table-header">Level</th>
                  <th className="table-header">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l: any) => (
                  <tr key={l.id} className="table-row">
                    <td className="table-cell font-mono text-xs text-gray-600">{l.action}</td>
                    <td className="table-cell text-gray-500 text-xs">{l.user_name || l.user_id || '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                        <Shield size={13} />{l.resource || '—'}
                      </div>
                    </td>
                    <td className="table-cell max-w-xs truncate text-gray-600 text-xs">
                      {typeof l.details === 'object' ? JSON.stringify(l.details) : l.details || '—'}
                    </td>
                    <td className="table-cell font-mono text-xs text-gray-400">{l.ip_address || '—'}</td>
                    <td className="table-cell">
                      <span className={`badge ${levelColors[l.level] || 'bg-gray-100 text-gray-500'}`}>{l.level || 'info'}</span>
                    </td>
                    <td className="table-cell text-gray-400 whitespace-nowrap text-xs">
                      {l.created_at ? format(new Date(l.created_at), 'MMM dd, HH:mm') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
