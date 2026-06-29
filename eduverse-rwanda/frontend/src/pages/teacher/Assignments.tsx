import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, ClipboardList, Eye, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = { title: '', class_id: '', subject_id: '', due_date: '', total_marks: '100', description: '' }

export default function TeacherAssignments() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [viewSubs, setViewSubs] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments-teacher'],
    queryFn: () => api.get('/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const { data: myData } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/teachers/my/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const { data: submissions } = useQuery({
    queryKey: ['submissions', viewSubs?.id],
    queryFn: () => api.get(`/assignments/${viewSubs.id}/submissions`).then(r => r.data.data || []),
    enabled: !!viewSubs,
  })

  const classes = [...new Map((myData || []).map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()]
  const subjectsForClass = (myData || []).filter((a: any) => a.class_id === form.class_id)

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/assignments', payload),
    onSuccess: () => {
      toast.success('Assignment created!')
      qc.invalidateQueries({ queryKey: ['assignments-teacher'] })
      setShowModal(false)
      setForm({ ...empty })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create assignment'),
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      total_marks: parseFloat(form.total_marks) || 100,
    })
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Assignments</h1><p className="text-sm text-gray-500">Manage class assignments</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={15} /> Create Assignment</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : (assignments || []).length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <ClipboardList size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No assignments yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> Create First Assignment</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(assignments || []).map((a: any) => {
            const pct = a.submission_count ? Math.round((a.submission_count / (a.total_students || 1)) * 100) : 0
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-primary-600" />
                    <span className="badge bg-blue-100 text-blue-600">{a.class_name}</span>
                    <span className="badge bg-purple-100 text-purple-600">{a.subject_name}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{a.title}</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'} · {a.total_marks} marks
                </p>
                <button
                  onClick={() => setViewSubs(a)}
                  className="btn-secondary w-full justify-center text-xs py-1.5"
                >
                  <Eye size={13} /> View Submissions
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Assignment</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required className="input" placeholder="Assignment title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Class *</label>
                  <select value={form.class_id} onChange={e => { set('class_id', e.target.value); set('subject_id', '') }} required className="input">
                    <option value="">Select class</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} required className="input" disabled={!form.class_id}>
                    <option value="">Select subject</option>
                    {subjectsForClass.map((s: any) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Total Marks</label>
                  <input type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} className="input" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input h-24 resize-none" placeholder="Assignment details..." />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary px-6">
                  {createMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions modal */}
      {viewSubs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{viewSubs.title}</h2>
                <p className="text-xs text-gray-400">{viewSubs.class_name} · {viewSubs.subject_name}</p>
              </div>
              <button onClick={() => setViewSubs(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <div className="px-6 py-5">
              {!submissions ? (
                <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
              ) : submissions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No submissions yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="table-header">Student</th>
                      <th className="table-header">Submitted</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s: any) => (
                      <tr key={s.id} className="table-row">
                        <td className="table-cell font-medium text-gray-800">{s.first_name} {s.last_name}</td>
                        <td className="table-cell text-gray-500 text-xs">{new Date(s.submitted_at).toLocaleDateString()}</td>
                        <td className="table-cell">
                          <span className={`badge ${s.status === 'graded' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{s.status}</span>
                        </td>
                        <td className="table-cell text-gray-600">{s.marks_obtained ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
