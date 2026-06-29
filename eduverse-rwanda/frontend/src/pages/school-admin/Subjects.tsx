import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Edit, Trash2, X, Loader2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = { name: '', code: '', description: '' }

export default function SchoolSubjects() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data || []),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/subjects', payload),
    onSuccess: () => {
      toast.success('Subject created!')
      qc.invalidateQueries({ queryKey: ['subjects'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create subject'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/subjects/${id}`, payload),
    onSuccess: () => {
      toast.success('Subject updated!')
      qc.invalidateQueries({ queryKey: ['subjects'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update subject'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      toast.success('Subject deleted')
      qc.invalidateQueries({ queryKey: ['subjects'] })
    },
    onError: () => toast.error('Failed to delete subject'),
  })

  const subjects: any[] = (data || []).filter((s: any) =>
    `${s.name} ${s.code || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditData(null); setForm({ ...empty }); setShowModal(true) }
  const openEdit = (s: any) => {
    setEditData(s)
    setForm({ name: s.name || '', code: s.code || '', description: s.description || '' })
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditData(null); setForm({ ...empty }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editData) updateMutation.mutate({ id: editData.id, payload: form })
    else createMutation.mutate(form)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Subjects</h1><p className="text-sm text-gray-500">Manage school subjects</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Subject</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{(data || []).length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Subjects</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{(data || []).filter((s: any) => s.department_name).length}</p>
          <p className="text-sm text-gray-500 mt-1">With Department</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="input pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <BookOpen size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No subjects found</p>
            <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Add First Subject</button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Subject</th>
                <th className="table-header">Code</th>
                <th className="table-header">Department</th>
                <th className="table-header">Description</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} className="text-blue-600" />
                      </div>
                      <p className="font-medium text-gray-800">{s.name}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    {s.code ? <span className="badge bg-gray-100 text-gray-600 font-mono">{s.code}</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="table-cell text-gray-500">{s.department_name || '—'}</td>
                  <td className="table-cell text-gray-400 text-xs max-w-[200px] truncate">{s.description || '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete subject "${s.name}"?`)) deleteMutation.mutate(s.id) }}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editData ? 'Edit Subject' : 'Add Subject'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Subject Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder="e.g. Data Structures and Algorithms" />
              </div>
              <div>
                <label className="label">Subject Code</label>
                <input value={form.code} onChange={e => set('code', e.target.value)} className="input" placeholder="e.g. CS301" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input h-20 resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6">
                  {isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : editData ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
