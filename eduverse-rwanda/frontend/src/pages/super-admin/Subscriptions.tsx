import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, CheckCircle, RefreshCw, XCircle, Plus, X, ShieldOff, ShieldCheck, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

const planColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600', standard: 'bg-blue-100 text-blue-600',
  premium: 'bg-purple-100 text-purple-600', enterprise: 'bg-orange-100 text-orange-600',
}
const subStatusColors: Record<string, string> = {
  active:         'bg-green-100 text-green-600',
  expiring_soon:  'bg-yellow-100 text-yellow-700',
  expired:        'bg-red-100 text-red-500',
  suspended:      'bg-red-200 text-red-700',
  pending:        'bg-gray-100 text-gray-500',
}

const plans = ['basic', 'standard', 'premium', 'enterprise']
const planPrices: Record<string, number> = { basic: 49, standard: 99, premium: 199, enterprise: 399 }

const today = new Date().toISOString().split('T')[0]
const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export default function SuperSubscriptions() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    school_id: '', plan: 'basic', amount: planPrices.basic,
    start_date: today, end_date: oneYear,
    payment_method: '', payment_reference: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => api.get('/subscriptions').then(r => r.data.data || {}),
    retry: false,
  })

  const { data: schoolsData } = useQuery({
    queryKey: ['schools-list'],
    queryFn: () => api.get('/schools?limit=200').then(r => r.data.data || []),
    retry: false,
  })

  const { mutate: addSub, isPending: adding } = useMutation({
    mutationFn: () => api.post('/subscriptions', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); setShowForm(false) },
  })

  const { mutate: revoke } = useMutation({
    mutationFn: (id: string) => api.patch(`/subscriptions/${id}/revoke`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  const { mutate: reinstate } = useMutation({
    mutationFn: (id: string) => api.patch(`/subscriptions/${id}/reinstate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })

  const subs: any[]     = data?.subscriptions || []
  const revTrend: any[] = data?.revenue_trend || []
  const totalRevenue    = data?.total_revenue ?? 0
  const activeCount     = subs.filter((s: any) => s.sub_status === 'active').length
  const renewalsDue     = subs.filter((s: any) => s.sub_status === 'expiring_soon').length
  const expiredCount    = subs.filter((s: any) => ['expired', 'suspended'].includes(s.sub_status)).length

  const schools: any[] = schoolsData || []

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="text-sm text-gray-500">Manage school subscriptions and billing</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={15} /> Add Subscription</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', val: `$${Number(totalRevenue).toLocaleString()}`, icon: DollarSign,  color: 'text-green-600 bg-green-50' },
          { label: 'Active Plans',  val: activeCount,  icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
          { label: 'Expiring Soon', val: renewalsDue,  icon: RefreshCw,   color: 'text-orange-600 bg-orange-50' },
          { label: 'Expired/Suspended', val: expiredCount, icon: XCircle, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
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

      {/* Subscriptions table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
          <h3 className="section-title">All Schools</h3>
          <p className="text-xs text-gray-400">{subs.length} schools</p>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : subs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No schools yet</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">School</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Total Paid</th>
                <th className="table-header">Status</th>
                <th className="table-header">Expires</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <p className="font-medium text-gray-800">{s.school_name}</p>
                    <p className="text-xs text-gray-400">{s.email}</p>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${planColors[s.plan] || 'bg-gray-100 text-gray-600'}`}>{s.plan || '—'}</span>
                  </td>
                  <td className="table-cell font-semibold text-gray-700">
                    ${Number(s.total_paid || 0).toLocaleString()}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${subStatusColors[s.sub_status] || 'bg-gray-100 text-gray-500'}`}>
                      {s.sub_status === 'expiring_soon' ? '⚠ Expiring Soon' : s.sub_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="table-cell text-gray-500 text-sm">
                    {s.subscription_end ? format(new Date(s.subscription_end), 'MMM dd, yyyy') : '—'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {s.school_status === 'suspended' ? (
                        <button
                          onClick={() => reinstate(s.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition-colors"
                          title="Reinstate access"
                        >
                          <ShieldCheck size={13} /> Reinstate
                        </button>
                      ) : (
                        <button
                          onClick={() => { if (confirm(`Suspend access for ${s.school_name}?`)) revoke(s.id) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                          title="Revoke access"
                        >
                          <ShieldOff size={13} /> Revoke
                        </button>
                      )}
                      <button
                        onClick={() => { setForm(f => ({ ...f, school_id: s.id })); setShowForm(true) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        <RefreshCw size={13} /> Renew
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-lg">Add / Renew Subscription</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="label">School</label>
              <select className="input" value={form.school_id} onChange={e => setForm(f => ({ ...f, school_id: e.target.value }))}>
                <option value="">Select school...</option>
                {schools.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Plan</label>
                <select className="input" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value, amount: planPrices[e.target.value] || 0 }))}>
                  {plans.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} — ${planPrices[p]}/mo</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount ($)</label>
                <input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="">Select...</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="label">Payment Reference</label>
                <input className="input" placeholder="e.g. TXN-12345" value={form.payment_reference} onChange={e => setForm(f => ({ ...f, payment_reference: e.target.value }))} />
              </div>
            </div>

            {!form.school_id && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle size={14} /> Please select a school
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => addSub()}
                disabled={!form.school_id || adding}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {adding ? 'Saving...' : 'Save Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
