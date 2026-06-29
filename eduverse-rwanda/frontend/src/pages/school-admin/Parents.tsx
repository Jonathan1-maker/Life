import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Trash2, X, Loader2, Users, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = {
  first_name: '', last_name: '', email: '', phone: '', gender: 'male',
  relationship: 'parent', student_ids: [] as string[],
}

export default function SchoolParents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewParent, setViewParent] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })

  const { data, isLoading } = useQuery({
    queryKey: ['parents'],
    queryFn: () => api.get('/parents').then(r => r.data.data || []),
    retry: false,
  })

  const { data: childrenData } = useQuery({
    queryKey: ['parent-children', viewParent?.id],
    queryFn: () => api.get(`/parents/${viewParent.id}/children`).then(r => r.data.data || []),
    enabled: !!viewParent,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/parents', payload),
    onSuccess: () => {
      toast.success('Parent added successfully!')
      qc.invalidateQueries({ queryKey: ['parents'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add parent'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parents/${id}`),
    onSuccess: () => {
      toast.success('Parent removed')
      qc.invalidateQueries({ queryKey: ['parents'] })
    },
    onError: () => toast.error('Failed to delete parent'),
  })

  const parents: any[] = (data || []).filter((p: any) =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const closeModal = () => { setShowModal(false); setForm({ ...empty }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Parents</h1>
          <p className="text-sm text-gray-500">Manage parents & guardians</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Add Parent</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{(data || []).length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Parents</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {(data || []).reduce((acc: number, p: any) => acc + parseInt(p.children_count || 0), 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Linked Children</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parents..." className="input pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : parents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <Users size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No parents found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Add First Parent</button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Parent / Guardian</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Children</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-semibold text-sm flex-shrink-0">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{p.phone || '—'}</td>
                  <td className="table-cell">
                    <span className="badge bg-blue-100 text-blue-600">{p.children_count} child{parseInt(p.children_count) !== 1 ? 'ren' : ''}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewParent(p)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg" title="View children"
                      >
                        <Eye size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${p.first_name} ${p.last_name}?`)) deleteMutation.mutate(p.id) }}
                        className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete"
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

      {/* Add Parent Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Parent / Guardian</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required className="input" placeholder="Jean" />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required className="input" placeholder="Habimana" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="input" placeholder="parent@example.rw" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="+250 788 000 000" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Relationship</label>
                  <select value={form.relationship} onChange={e => set('relationship', e.target.value)} className="input">
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">Default password: <span className="font-mono">Parent@123</span></p>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary px-6">
                  {createMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Add Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Children Modal */}
      {viewParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{viewParent.first_name}'s Children</h2>
              <button onClick={() => setViewParent(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="px-6 py-5">
              {!childrenData ? (
                <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
              ) : childrenData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No children linked yet</p>
              ) : (
                <div className="space-y-3">
                  {childrenData.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-400">{c.class_name || '—'} · {c.relationship}</p>
                      </div>
                      <span className={`badge ${c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
