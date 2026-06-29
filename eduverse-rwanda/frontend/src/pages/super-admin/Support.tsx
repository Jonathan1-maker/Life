import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Search, Plus, MessageCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600',
}
const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  open:        { color: 'bg-blue-100 text-blue-700',   icon: Clock },
  in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: MessageCircle },
  resolved:    { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed:      { color: 'bg-gray-100 text-gray-600',   icon: CheckCircle },
}

export default function SuperSupport() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api.get('/support').then(r => r.data.data || []),
    retry: false,
  })

  const tickets: any[] = (data || []).filter((t: any) =>
    t.subject?.toLowerCase().includes(search.toLowerCase()) &&
    (status === 'all' || t.status === status)
  )

  const openCount       = (data || []).filter((t: any) => t.status === 'open').length
  const inProgressCount = (data || []).filter((t: any) => t.status === 'in_progress').length
  const resolvedCount   = (data || []).filter((t: any) => t.status === 'resolved').length
  const urgentCount     = (data || []).filter((t: any) => t.priority === 'urgent').length

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Support</h1>
          <p className="text-sm text-gray-500">Manage support tickets from schools</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> New Ticket</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open',        val: openCount,       icon: Clock,         color: 'text-blue-600 bg-blue-50' },
          { label: 'In Progress', val: inProgressCount, icon: MessageCircle, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Resolved',    val: resolvedCount,   icon: CheckCircle,   color: 'text-green-600 bg-green-50' },
          { label: 'Urgent',      val: urgentCount,     icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="input pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <MessageCircle size={36} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No tickets found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Subject</th>
                <th className="table-header">School</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t: any) => {
                const sc = statusConfig[t.status] || statusConfig.open
                const StatusIcon = sc.icon
                return (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell font-medium text-gray-800 max-w-xs truncate">{t.subject}</td>
                    <td className="table-cell text-gray-500">{t.school_name || '—'}</td>
                    <td className="table-cell"><span className={`badge ${priorityColors[t.priority] || 'bg-gray-100 text-gray-600'}`}>{t.priority}</span></td>
                    <td className="table-cell"><span className={`badge gap-1 ${sc.color}`}><StatusIcon size={11} />{t.status?.replace('_', ' ')}</span></td>
                    <td className="table-cell text-gray-400">{t.created_at ? format(new Date(t.created_at), 'MMM dd, yyyy') : '—'}</td>
                    <td className="table-cell"><button className="btn-secondary text-xs py-1.5 px-3">View</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
