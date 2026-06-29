import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, BookOpen, Users, Edit, Trash2, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = { name: '', level: '', school_level: 'ordinary', class_teacher_id: '', academic_year_id: '' }

export default function SchoolClasses() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })

  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
    retry: false,
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data.data || []),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/classes', payload),
    onSuccess: () => {
      toast.success('Class created!')
      qc.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create class'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/classes/${id}`, payload),
    onSuccess: () => {
      toast.success('Class updated!')
      qc.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update class'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      toast.success('Class deleted')
      qc.invalidateQueries({ queryKey: ['classes'] })
    },
    onError: () => toast.error('Failed to delete class'),
  })

  const classes: any[] = (data || []).filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditData(null); setForm({ ...empty }); setShowModal(true) }
  const openEdit = (c: any) => {
    setEditData(c)
    setForm({ name: c.name || '', level: c.level || '', school_level: c.school_level || 'ordinary', class_teacher_id: c.class_teacher_id || '', academic_year_id: c.academic_year_id || '' })
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
        <div><h1 className="page-title">Classes</h1><p className="text-sm text-gray-500">Manage school classes</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Class</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Classes', val: (data || []).length, color: 'text-blue-600' },
          { label: 'Total Students', val: (data || []).reduce((a: number, c: any) => a + parseInt(c.student_count || 0), 0), color: 'text-green-600' },
          { label: 'With Teacher', val: (data || []).filter((c: any) => c.class_teacher_id).length, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." className="input pl-9" />
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : classes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <BookOpen size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No classes found</p>
          <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Add First Class</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c: any) => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={18} className="text-primary-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                    <Edit size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete class ${c.name}?`)) deleteMutation.mutate(c.id) }}
                    className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">{c.name}</h3>
              <p className="text-xs text-gray-400 mb-3">Level: {c.level ? `S${c.level}` : '—'}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-500"><Users size={13} />{c.student_count || 0} students</div>
                <span className="text-xs text-gray-400 truncate max-w-[120px]">{c.teacher_name || 'No teacher'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editData ? 'Edit Class' : 'Add Class'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Class Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder="e.g. Senior 3 A" />
              </div>
              <div>
                <label className="label">Level</label>
                <input value={form.level} onChange={e => set('level', e.target.value)} className="input" placeholder="e.g. S3, L4, Form 2" />
              </div>
              <div>
                <label className="label">School Level</label>
                <select value={form.school_level} onChange={e => set('school_level', e.target.value)} className="input">
                  <option value="ordinary">Ordinary Level</option>
                  <option value="advanced">Advanced Level</option>
                </select>
              </div>
              <div>
                <label className="label">Class Teacher</label>
                <select value={form.class_teacher_id} onChange={e => set('class_teacher_id', e.target.value)} className="input">
                  <option value="">Select teacher</option>
                  {(teachers || []).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6">
                  {isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : editData ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
