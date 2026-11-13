import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Trash2, X, Loader2, Users, UserPlus, Link } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = {
  first_name: '', last_name: '', email: '', phone: '', gender: 'male', relationship: 'parent',
}

export default function SchoolParents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewParent, setViewParent] = useState<any>(null)
  const [tab, setTab] = useState<'children' | 'assign'>('children')
  const [studentSearch, setStudentSearch] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [form, setForm] = useState({ ...empty })

  const { data, isLoading } = useQuery({
    queryKey: ['parents'],
    queryFn: () => api.get('/parents').then(r => r.data.data || []),
    retry: false,
  })

  const { data: allStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data.data || []),
    enabled: !!viewParent,
    retry: false,
  })

  const { data: childrenData, refetch: refetchChildren } = useQuery({
    queryKey: ['parent-children', viewParent?.id],
    queryFn: () => api.get(`/parents/${viewParent.id}/children`).then(r => r.data.data || []),
    enabled: !!viewParent,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/parents', payload),
    onSuccess: () => {
      toast.success('Parent added!')
      qc.invalidateQueries({ queryKey: ['parents'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to add parent'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parents/${id}`),
    onSuccess: () => { toast.success('Parent removed'); qc.invalidateQueries({ queryKey: ['parents'] }) },
    onError: () => toast.error('Failed to delete parent'),
  })

  const linkMutation = useMutation({
    mutationFn: ({ student_id }: { student_id: string }) =>
      api.post(`/parents/${viewParent.id}/link-child`, { student_id, relationship }),
    onSuccess: () => {
      toast.success('Student linked!')
      refetchChildren()
      qc.invalidateQueries({ queryKey: ['parents'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to link student'),
  })

  const unlinkMutation = useMutation({
    mutationFn: (student_id: string) =>
      api.delete(`/parents/${viewParent.id}/unlink-child`, { data: { student_id } }),
    onSuccess: () => {
      toast.success('Student unlinked')
      refetchChildren()
      qc.invalidateQueries({ queryKey: ['parents'] })
    },
    onError: () => toast.error('Failed to unlink student'),
  })

  const parents: any[] = (data || []).filter((p: any) =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const linkedIds = new Set((childrenData || []).map((c: any) => c.id))

  const filteredStudents = (allStudents || []).filter((s: any) =>
    `${s.first_name} ${s.last_name} ${s.admission_number || ''}`.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const closeModal = () => { setShowModal(false); setForm({ ...empty }) }

  const openView = (p: any) => {
    setViewParent(p)
    setTab('children')
    setStudentSearch('')
    setRelationship('parent')
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
          <div className="flex flex-col items-center justify-center h-40">
            <Users size={40} className="mb-2 opacity-30 text-gray-300" />
            <p className="text-sm text-gray-400">No parents found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Add First Parent</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[450px]">
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
                      <button onClick={() => openView(p)} className="p-1.5 hover:bg-primary-50 rounded-lg" title="Manage children">
                        <Link size={14} className="text-primary-600" />
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
          </div>
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
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form) }} className="px-6 py-5 space-y-4">
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

      {/* Manage Children Modal */}
      {viewParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewParent.first_name} {viewParent.last_name}</h2>
                <p className="text-xs text-gray-400">{viewParent.email}</p>
              </div>
              <button onClick={() => setViewParent(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { key: 'children', label: `Linked Children (${(childrenData || []).length})` },
                { key: 'assign', label: 'Assign Student' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as any)}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Linked Children Tab */}
              {tab === 'children' && (
                <>
                  {!childrenData ? (
                    <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
                  ) : childrenData.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Users size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No children linked yet</p>
                      <button onClick={() => setTab('assign')} className="btn-primary mt-3 text-xs py-1.5"><UserPlus size={13} /> Assign a Student</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {childrenData.map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                            {c.first_name?.[0]}{c.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm">{c.first_name} {c.last_name}</p>
                            <p className="text-xs text-gray-400">{c.class_name || '—'} · {c.relationship}</p>
                          </div>
                          <button
                            onClick={() => { if (confirm(`Unlink ${c.first_name}?`)) unlinkMutation.mutate(c.id) }}
                            disabled={unlinkMutation.isPending}
                            className="p-1.5 hover:bg-red-50 rounded-lg flex-shrink-0"
                            title="Unlink"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Assign Student Tab */}
              {tab === 'assign' && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Relationship</label>
                    <select value={relationship} onChange={e => setRelationship(e.target.value)} className="input">
                      <option value="parent">Parent</option>
                      <option value="guardian">Guardian</option>
                      <option value="sibling">Sibling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Search Student</label>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search by name or admission number..."
                        className="input pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">
                        {studentSearch ? 'No students match your search' : 'Start typing to search students'}
                      </p>
                    ) : (
                      filteredStudents.map((s: any) => {
                        const linked = linkedIds.has(s.id)
                        return (
                          <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border ${linked ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                              {s.first_name?.[0]}{s.last_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                              <p className="text-xs text-gray-400">{s.class_name || '—'} · {s.admission_number || 'No ADM'}</p>
                            </div>
                            {linked ? (
                              <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded-full">Linked</span>
                            ) : (
                              <button
                                onClick={() => linkMutation.mutate({ student_id: s.id })}
                                disabled={linkMutation.isPending}
                                className="btn-primary text-xs py-1.5 px-3"
                              >
                                {linkMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                                Assign
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewParent(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
