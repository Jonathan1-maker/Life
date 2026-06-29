import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, School, MapPin, Eye, Edit, Trash2, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const planColors: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600', standard: 'bg-blue-100 text-blue-600',
  premium: 'bg-purple-100 text-purple-600', enterprise: 'bg-orange-100 text-orange-600',
}

const empty = {
  name: '', slug: '', email: '', phone: '', address: '', city: '', province: '',
  type: 'secondary', subscription_plan: 'basic',
  subscription_start: '', subscription_end: '',
  max_students: 500, max_teachers: 50,
  admin_first_name: '', admin_last_name: '', admin_email: '', admin_password: '',
}

export default function Schools() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [step, setStep] = useState(1) // 1 = school info, 2 = admin account

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: () => api.get('/schools').then(r => r.data.data || []),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/schools', payload),
    onSuccess: () => {
      toast.success('School created successfully!')
      qc.invalidateQueries({ queryKey: ['schools'] })
      setShowModal(false)
      setForm({ ...empty })
      setStep(1)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create school')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schools/${id}`),
    onSuccess: () => {
      toast.success('School deleted')
      qc.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: () => toast.error('Failed to delete school'),
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete('/schools'),
    onSuccess: () => {
      toast.success('All schools deleted')
      qc.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: () => toast.error('Failed to delete all schools'),
  })

  const schools: any[] = (data || []).filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || s.subscription_plan === filter)
  )

  const total    = (data || []).length
  const active   = (data || []).filter((s: any) => s.status === 'active').length
  const pending  = (data || []).filter((s: any) => s.status === 'pending').length
  const inactive = (data || []).filter((s: any) => s.status === 'suspended' || s.status === 'expired').length

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    set('name', val)
    set('slug', val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    createMutation.mutate(form)
  }

  const closeModal = () => { setShowModal(false); setForm({ ...empty }); setStep(1) }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Schools</h1>
          <p className="text-sm text-gray-500">Manage all registered schools</p>
        </div>
        <div className="flex items-center gap-2">
          {(data || []).length > 0 && (
            <button
              onClick={() => { if (confirm('Delete ALL schools and their data? This cannot be undone.')) deleteAllMutation.mutate() }}
              disabled={deleteAllMutation.isPending}
              className="btn-danger"
            >
              {deleteAllMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Clear All
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={15} /> Add School
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', val: total,    color: 'text-blue-600' },
          { label: 'Active',        val: active,   color: 'text-green-600' },
          { label: 'Pending',       val: pending,  color: 'text-orange-600' },
          { label: 'Inactive',      val: inactive, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools..." className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'basic', 'standard', 'premium', 'enterprise'].map(p => (
            <button key={p} onClick={() => setFilter(p)} className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : schools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <School size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No schools found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-xs py-1.5">
              <Plus size={13} /> Add First School
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">School</th>
                <th className="table-header">Location</th>
                <th className="table-header">Type</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <School size={16} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPin size={12} />{s.city || '—'}{s.province ? `, ${s.province}` : ''}
                    </div>
                  </td>
                  <td className="table-cell capitalize text-gray-500">{s.type || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${planColors[s.subscription_plan] || 'bg-gray-100 text-gray-600'}`}>{s.subscription_plan || '—'}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${s.status === 'active' ? 'bg-green-100 text-green-600' : s.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>{s.status}</span>
                  </td>
                  <td className="table-cell text-gray-400">{s.created_at ? format(new Date(s.created_at), 'MMM yyyy') : '—'}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={14} className="text-gray-500" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit size={14} className="text-gray-500" /></button>
                      <button
                        onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteMutation.mutate(s.id) }}
                        className="p-1.5 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── ADD SCHOOL MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add New School</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 1 ? 'Step 1 of 2 — School Information' : 'Step 2 of 2 — Admin Account'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 flex items-center gap-3">
              {[1, 2].map(n => (
                <div key={n} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= n ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{n}</div>
                  <span className={`text-xs font-medium ${step >= n ? 'text-primary-600' : 'text-gray-400'}`}>
                    {n === 1 ? 'School Info' : 'Admin Account'}
                  </span>
                  {n < 2 && <div className={`w-8 h-0.5 ${step > n ? 'bg-primary-500' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {step === 1 ? (
                <>
                  {/* School info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="label">School Name *</label>
                      <input value={form.name} onChange={e => handleNameChange(e.target.value)} required placeholder="e.g. Groupe Scolaire Saint Paul" className="input" />
                    </div>
                    <div>
                      <label className="label">Slug *</label>
                      <input value={form.slug} onChange={e => set('slug', e.target.value)} required placeholder="gs-saint-paul" className="input" />
                    </div>
                    <div>
                      <label className="label">Official Email *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="school@example.rw" className="input" />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+250 788 000 000" className="input" />
                    </div>
                    <div>
                      <label className="label">City</label>
                      <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Kigali" className="input" />
                    </div>
                    <div>
                      <label className="label">Province</label>
                      <select value={form.province} onChange={e => set('province', e.target.value)} className="input">
                        <option value="">Select province</option>
                        {['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">School Type</label>
                      <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
                        <option value="secondary">Secondary</option>
                        <option value="primary">Primary</option>
                        <option value="mixed">Mixed</option>
                        <option value="tvet">TVET</option>
                        <option value="university">University</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Subscription Plan</label>
                      <select value={form.subscription_plan} onChange={e => set('subscription_plan', e.target.value)} className="input">
                        <option value="basic">Basic — $49/mo</option>
                        <option value="standard">Standard — $149/mo</option>
                        <option value="premium">Premium — $299/mo</option>
                        <option value="enterprise">Enterprise — Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Subscription Start</label>
                      <input type="date" value={form.subscription_start} onChange={e => set('subscription_start', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Subscription End</label>
                      <input type="date" value={form.subscription_end} onChange={e => set('subscription_end', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Max Students</label>
                      <input type="number" value={form.max_students} onChange={e => set('max_students', parseInt(e.target.value))} className="input" />
                    </div>
                    <div>
                      <label className="label">Max Teachers</label>
                      <input type="number" value={form.max_teachers} onChange={e => set('max_teachers', parseInt(e.target.value))} className="input" />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Address</label>
                      <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" className="input" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Admin account */}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-2">
                    <p className="text-sm font-semibold text-blue-800">School Admin Account</p>
                    <p className="text-xs text-blue-600 mt-0.5">This person will manage <strong>{form.name}</strong> on the platform.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input value={form.admin_first_name} onChange={e => set('admin_first_name', e.target.value)} required placeholder="Jean" className="input" />
                    </div>
                    <div>
                      <label className="label">Last Name *</label>
                      <input value={form.admin_last_name} onChange={e => set('admin_last_name', e.target.value)} required placeholder="Habimana" className="input" />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Admin Email *</label>
                      <input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} required placeholder="admin@school.rw" className="input" />
                    </div>
                    <div className="col-span-2">
                      <label className="label">Password *</label>
                      <input type="password" value={form.admin_password} onChange={e => set('admin_password', e.target.value)} required placeholder="Min 8 characters" minLength={8} className="input" />
                    </div>
                  </div>
                </>
              )}

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
                <button type="button" onClick={step === 1 ? closeModal : () => setStep(1)} className="btn-secondary">
                  {step === 1 ? 'Cancel' : '← Back'}
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary px-6">
                  {createMutation.isPending ? (
                    <><Loader2 size={15} className="animate-spin" /> Creating...</>
                  ) : step === 1 ? (
                    <>Next → Admin Account</>
                  ) : (
                    <><Plus size={15} /> Create School</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
