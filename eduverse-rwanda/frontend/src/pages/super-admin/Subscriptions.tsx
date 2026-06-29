import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, CheckCircle, RefreshCw, XCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'

const planColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600', standard: 'bg-blue-100 text-blue-600',
  premium: 'bg-purple-100 text-purple-600', enterprise: 'bg-orange-100 text-orange-600',
}
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-600', trial: 'bg-yellow-100 text-yellow-600',
  expired: 'bg-red-100 text-red-500', pending: 'bg-gray-100 text-gray-500',
}

export default function SuperSubscriptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subscriptions').then(r => r.data.data || {}),
    retry: false,
  })

  const subs: any[]    = data?.subscriptions || data || []
  const revTrend: any[] = data?.revenue_trend || []
  const totalRevenue   = data?.total_revenue ?? 0
  const activeCount    = subs.filter((s: any) => s.status === 'active').length
  const renewalsDue    = subs.filter((s: any) => {
    if (!s.end_date) return false
    const days = (new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days <= 30 && days > 0
  }).length
  const expiredCount   = subs.filter((s: any) => s.status === 'expired').length

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Subscriptions</h1>
        <p className="text-sm text-gray-500">Manage school subscriptions and billing</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',  val: `$${Number(totalRevenue).toLocaleString()}`, icon: DollarSign,  color: 'text-green-600 bg-green-50' },
          { label: 'Active Plans',   val: activeCount,   icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
          { label: 'Renewals Due',   val: renewalsDue,   icon: RefreshCw,   color: 'text-orange-600 bg-orange-50' },
          { label: 'Expired',        val: expiredCount,  icon: XCircle,     color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Revenue Trend</h3>
        {revTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No revenue data yet</div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50"><h3 className="section-title">All Subscriptions</h3></div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : subs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No subscriptions yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">School</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">End Date</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell font-medium text-gray-800">{s.school_name || s.school || '—'}</td>
                  <td className="table-cell"><span className={`badge ${planColors[s.plan] || 'bg-gray-100 text-gray-600'}`}>{s.plan}</span></td>
                  <td className="table-cell font-semibold">{s.amount ? `$${s.amount}/mo` : '—'}</td>
                  <td className="table-cell"><span className={`badge ${statusColors[s.status] || 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                  <td className="table-cell text-gray-500">{s.end_date ? format(new Date(s.end_date), 'MMM dd, yyyy') : '—'}</td>
                  <td className="table-cell"><button className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={14} className="text-gray-500" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
