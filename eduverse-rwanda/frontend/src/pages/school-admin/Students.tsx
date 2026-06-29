import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Edit, Trash2, X, Loader2, GraduationCap, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = {
  first_name: '', last_name: '', email: '', phone: '', gender: 'male',
  date_of_birth: '', class_id: '', stream_id: '', admission_number: '',
  admission_date: '', blood_group: '', emergency_contact_name: '', emergency_contact_phone: '',
}

export default function SchoolStudents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })
  const [generatingAdm, setGeneratingAdm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(r => r.data.data || []),
    retry: false,
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/students', payload),
    onSuccess: () => {
      toast.success('Student enrolled!')
      qc.invalidateQueries({ queryKey: ['students'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to enroll student'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/students/${id}`, payload),
    onSuccess: () => {
      toast.success('Student updated!')
      qc.invalidateQueries({ queryKey: ['students'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update student'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Student removed')
      qc.invalidateQueries({ queryKey: ['students'] })
    },
    onError: () => toast.error('Failed to delete student'),
  })

  const students: any[] = (data || []).filter((s: any) =>
    `${s.first_name} ${s.last_name} ${s.admission_number || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = async () => {
    setEditData(null)
    setForm({ ...empty })
    setShowModal(true)
    // auto-generate admission number
    try {
      setGeneratingAdm(true)
      const { data } = await api.get('/students/generate-admission')
      setForm(f => ({ ...f, admission_number: data.data.admission_number }))
    } catch {}
    finally { setGeneratingAdm(false) }
  }

  const generateAdmission = async () => {
    try {
      setGeneratingAdm(true)
      const { data } = await api.get('/students/generate-admission')
      setForm(f => ({ ...f, admission_number: data.data.admission_number }))
    } catch { toast.error('Failed to generate') }
    finally { setGeneratingAdm(false) }
  }
  const openEdit = (s: any) => {
    setEditData(s)
    setForm({
      first_name: s.first_name || '', last_name: s.last_name || '',
      email: s.email || '', phone: s.phone || '', gender: s.gender || 'male',
      date_of_birth: s.date_of_birth?.slice(0, 10) || '',
      class_id: s.class_id || '', stream_id: s.stream_id || '',
      admission_number: s.admission_number || '',
      admission_date: s.admission_date?.slice(0, 10) || '',
      blood_group: s.blood_group || '',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
    })
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
        <div><h1 className="page-title">Students</h1><p className="text-sm text-gray-500">Manage enrolled students</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Enroll Student</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', val: (data || []).length, color: 'text-blue-600' },
          { label: 'Active', val: (data || []).filter((s: any) => s.status === 'active' || !s.status).length, color: 'text-green-600' },
          { label: 'Classes', val: (classes || []).length, color: 'text-purple-600' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission number..." className="input pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <GraduationCap size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No students found</p>
            <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Enroll First Student</button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Admission No.</th>
                <th className="table-header">Class</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Status</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{s.admission_number || '—'}</td>
                  <td className="table-cell">
                    {s.class_name
                      ? <span className="badge bg-blue-100 text-blue-600">{s.class_name}{s.stream_name ? ` · ${s.stream_name}` : ''}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="table-cell text-gray-500 capitalize">{s.gender || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${s.status === 'active' || !s.status ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status || 'active'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit">
                        <Edit size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Remove ${s.first_name} ${s.last_name}?`)) deleteMutation.mutate(s.id) }}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editData ? 'Edit Student' : 'Enroll Student'}</h2>
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
                {!editData && (
                  <div className="col-span-2">
                    <label className="label">Email *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="input" placeholder="student@school.rw" />
                  </div>
                )}
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
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Admission Number</label>
                  <div className="flex gap-2">
                    <input value={form.admission_number} onChange={e => set('admission_number', e.target.value)} className="input" placeholder="ADM-2025-0001" />
                    {!editData && (
                      <button type="button" onClick={generateAdmission} disabled={generatingAdm} className="btn-secondary px-3 flex-shrink-0" title="Generate">
                        <RefreshCw size={14} className={generatingAdm ? 'animate-spin' : ''} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">Admission Date</label>
                  <input type="date" value={form.admission_date} onChange={e => set('admission_date', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Class</label>
                  <select value={form.class_id} onChange={e => set('class_id', e.target.value)} className="input">
                    <option value="">Select class</option>
                    {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)} className="input">
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Emergency Contact Name</label>
                  <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className="input" placeholder="Parent name" />
                </div>
                <div>
                  <label className="label">Emergency Contact Phone</label>
                  <input value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className="input" placeholder="+250 788 000 000" />
                </div>
              </div>
              {!editData && (
                <p className="text-xs text-gray-400">Default password: <span className="font-mono font-medium">Student@123</span></p>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6">
                  {isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : editData ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
