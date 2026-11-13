import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Search, MessageCircle, Clock, CheckCircle, AlertTriangle, X, Send, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}
const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  open:        { color: 'bg-blue-100 text-blue-700',   icon: Clock },
  in_progress: { color: 'bg-yellow-100 text-yellow-700', icon: MessageCircle },
  resolved:    { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed:      { color: 'bg-gray-100 text-gray-600',   icon: CheckCircle },
}

export default function SuperSupport() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => api.get('/support').then(r => r.data.data || []),
    retry: false,
  })

  const { mutate: updateStatus, isPending: updatingStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/support/${id}/status`, { status }).then(r => r.data.data),
    onSuccess: updated => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      setSelected(updated)
    },
  })

  const { mutate: sendReply, isPending: sendingReply } = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.post(`/support/${id}/reply`, { reply }).then(r => r.data.data),
    onSuccess: updated => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] })
      setSelected(updated)
      setReply('')
    },
  })

  const tickets: any[] = (data || []).filter((t: any) =>
    `${t.subject} ${t.user_name}`.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || t.status === statusFilter)
  )

  const openCount       = (data || []).filter((t: any) => t.status === 'open').length
  const inProgressCount = (data || []).filter((t: any) => t.status === 'in_progress').length
  const resolvedCount   = (data || []).filter((t: any) => t.status === 'resolved').length
  const urgentCount     = (data || []).filter((t: any) => t.priority === 'urgent').length

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Support</h1>
        <p className="text-sm text-gray-500">Manage support tickets from schools</p>
      </div>

      {/* Stats */}
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

      {/* Search + filter */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..." className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Tickets list */}
        <div className={`card overflow-hidden ${selected ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <MessageCircle size={36} className="mb-2 opacity-20" />
              <p className="text-sm text-gray-400">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Subject</th>
                  <th className="table-header">User</th>
                  <th className="table-header">Priority</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: any) => {
                  const sc = statusConfig[t.status] || statusConfig.open
                  const StatusIcon = sc.icon
                  return (
                    <tr key={t.id} onClick={() => setSelected(t)}
                      className={`table-row cursor-pointer ${selected?.id === t.id ? 'bg-primary-50' : ''}`}>
                      <td className="table-cell font-medium text-gray-800 max-w-xs">
                        <p className="truncate">{t.subject}</p>
                        {t.admin_reply && <p className="text-xs text-green-600 mt-0.5">✓ Replied</p>}
                      </td>
                      <td className="table-cell text-gray-500 text-xs">{t.user_name || '—'}</td>
                      <td className="table-cell"><span className={`badge ${priorityColors[t.priority] || 'bg-gray-100 text-gray-600'}`}>{t.priority}</span></td>
                      <td className="table-cell"><span className={`badge gap-1 ${sc.color}`}><StatusIcon size={11} />{t.status?.replace('_', ' ')}</span></td>
                      <td className="table-cell text-gray-400 text-xs whitespace-nowrap">{t.created_at ? format(new Date(t.created_at), 'MMM dd') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Ticket detail panel */}
        {selected && (
          <div className="card p-6 flex-1 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-gray-800 text-lg leading-tight">{selected.subject}</h2>
                <p className="text-xs text-gray-400 mt-1">
                  From <span className="font-medium text-gray-600">{selected.user_name || 'Unknown'}</span>
                  {selected.school_name && <> · {selected.school_name}</>}
                  {' · '}{selected.created_at ? format(new Date(selected.created_at), 'MMM dd, yyyy HH:mm') : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18} /></button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <span className={`badge ${priorityColors[selected.priority] || 'bg-gray-100 text-gray-600'}`}>{selected.priority} priority</span>
              <span className={`badge ${(statusConfig[selected.status] || statusConfig.open).color}`}>{selected.status?.replace('_', ' ')}</span>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Message</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
            </div>

            {/* Existing reply */}
            {selected.admin_reply && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Your Reply · {selected.replied_at ? format(new Date(selected.replied_at), 'MMM dd, HH:mm') : ''}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.admin_reply}</p>
              </div>
            )}

            {/* Reply box */}
            <div>
              <label className="label">Reply to this ticket</label>
              <textarea
                className="input h-28 resize-none"
                placeholder="Type your reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => sendReply({ id: selected.id, reply })}
                  disabled={!reply.trim() || sendingReply}
                  className="btn-primary gap-2 disabled:opacity-60"
                >
                  <Send size={14} /> {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>

            {/* Status change */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Change Status</p>
              <div className="flex gap-2 flex-wrap">
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button
                    key={s}
                    disabled={selected.status === s || updatingStatus}
                    onClick={() => updateStatus({ id: selected.id, status: s })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors disabled:opacity-40 ${selected.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
