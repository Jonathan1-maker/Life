import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Edit, Trash2, X, Loader2, BookOpen, UserPlus, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const empty = { name: '', code: '', description: '' }

export default function SchoolSubjects() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [form, setForm] = useState({ ...empty })

  // Assign modal state
  const [assignSubject, setAssignSubject] = useState<any>(null)
  const [assignForm, setAssignForm] = useState({ teacher_id: '', class_id: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data || []),
    retry: false,
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => api.get('/teachers').then(r => r.data.data || []),
    enabled: !!assignSubject,
  })

  const { data: classes } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
    enabled: !!assignSubject,
  })

  // Fetch existing assignments for the selected subject
  const { data: subjectAssignments } = useQuery({
    queryKey: ['subject-assignments', assignSubject?.id],
    queryFn: () =>
      api.get('/teachers').then(async r => {
        const allTeachers = r.data.data || []
        const results: any[] = []
        await Promise.all(
          allTeachers.map(async (teacher: any) => {
            const res = await api.get(`/teachers/${teacher.id}/subjects`)
            const assigned = (res.data.data || []).filter((a: any) => a.subject_id === assignSubject.id)
            assigned.forEach((a: any) => results.push({ ...a, teacher_name: `${teacher.first_name} ${teacher.last_name}`, teacher_id: teacher.id }))
          })
        )
        return results
      }),
    enabled: !!assignSubject,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/subjects', payload),
    onSuccess: () => {
      toast.success(t('subjectsPage.addSubject') + '!')
      qc.invalidateQueries({ queryKey: ['subjects'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t('common.noData')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/subjects/${id}`, payload),
    onSuccess: () => {
      toast.success(t('common.update') + '!')
      qc.invalidateQueries({ queryKey: ['subjects'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t('common.noData')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      toast.success(t('common.delete') + '!')
      qc.invalidateQueries({ queryKey: ['subjects'] })
    },
    onError: () => toast.error(t('common.noData')),
  })

  const assignMutation = useMutation({
    mutationFn: () => api.post(`/teachers/${assignForm.teacher_id}/subjects`, {
      subject_id: assignSubject.id,
      class_id: assignForm.class_id,
    }),
    onSuccess: () => {
      toast.success('Subject assigned to teacher!')
      qc.invalidateQueries({ queryKey: ['subject-assignments', assignSubject?.id] })
      setAssignForm({ teacher_id: '', class_id: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to assign'),
  })

  const unassignMutation = useMutation({
    mutationFn: ({ teacher_id, class_id }: any) =>
      api.delete(`/teachers/${teacher_id}/subjects`, { data: { subject_id: assignSubject.id, class_id } }),
    onSuccess: () => {
      toast.success('Assignment removed')
      qc.invalidateQueries({ queryKey: ['subject-assignments', assignSubject?.id] })
    },
    onError: () => toast.error('Failed to remove assignment'),
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

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.teacher_id || !assignForm.class_id) return toast.error('Select both teacher and class')
    assignMutation.mutate()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="page-title">{t('subjects.title')}</h1><p className="text-sm text-gray-500">{t('subjects.subtitle')}</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> {t('subjectsPage.addSubject')}</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{(data || []).length}</p>
          <p className="text-sm text-gray-500 mt-1">{t('subjectsPage.totalSubjects')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{(data || []).filter((s: any) => s.department_name).length}</p>
          <p className="text-sm text-gray-500 mt-1">{t('subjectsPage.withDepartment')}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('subjectsPage.searchPlaceholder')} className="input pl-9" />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <BookOpen size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">{t('subjectsPage.noSubjects')}</p>
            <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> {t('subjectsPage.addFirst')}</button>
          </div>
        ) : (
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">{t('subjectsPage.subject')}</th>
                <th className="table-header">{t('subjects.code')}</th>
                <th className="table-header">{t('subjectsPage.department')}</th>
                <th className="table-header">{t('subjects.description')}</th>
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
                      <button
                        onClick={() => { setAssignSubject(s); setAssignForm({ teacher_id: '', class_id: '' }) }}
                        className="p-1.5 hover:bg-blue-50 rounded-lg"
                        title="Assign to teacher"
                      >
                        <UserPlus size={14} className="text-blue-500" />
                      </button>
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={t('common.edit')}>
                        <Edit size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`${t('subjectsPage.deleteConfirm')} "${s.name}"?`)) deleteMutation.mutate(s.id) }}
                        className="p-1.5 hover:bg-red-50 rounded-lg" title={t('common.delete')}
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

      {/* Add/Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editData ? t('subjectsPage.editSubject') : t('subjectsPage.addSubject')}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">{t('subjectsPage.subjectNameLabel')} *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder={t('subjectsPage.subjectNamePlaceholder')} />
              </div>
              <div>
                <label className="label">{t('subjectsPage.subjectCode')}</label>
                <input value={form.code} onChange={e => set('code', e.target.value)} className="input" placeholder={t('subjectsPage.subjectCodePlaceholder')} />
              </div>
              <div>
                <label className="label">{t('subjects.description')}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input h-20 resize-none" placeholder={t('subjectsPage.descriptionPlaceholder')} />
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={isPending} className="btn-primary px-6">
                  {isPending ? <><Loader2 size={15} className="animate-spin" /> {t('subjectsPage.saving')}</> : editData ? t('common.save') : t('subjectsPage.createSubject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Assign Teacher</h2>
                <p className="text-xs text-gray-500 mt-0.5">Subject: <span className="font-medium text-gray-700">{assignSubject.name}</span></p>
              </div>
              <button onClick={() => setAssignSubject(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>

            {/* Assign form */}
            <form onSubmit={handleAssign} className="px-6 pt-5 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Teacher *</label>
                  <select className="input" value={assignForm.teacher_id} onChange={e => setAssignForm(f => ({ ...f, teacher_id: e.target.value }))}>
                    <option value="">Select teacher</option>
                    {(teachers || []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select className="input" value={assignForm.class_id} onChange={e => setAssignForm(f => ({ ...f, class_id: e.target.value }))}>
                    <option value="">Select class</option>
                    {(classes || []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={assignMutation.isPending} className="btn-primary w-full justify-center">
                {assignMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Assigning…</> : <><UserPlus size={14} /> Assign Teacher</>}
              </button>
            </form>

            {/* Current assignments */}
            <div className="px-6 pb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Assignments</p>
              {!subjectAssignments ? (
                <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
              ) : subjectAssignments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No teachers assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {subjectAssignments.map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                          <User size={13} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{a.teacher_name}</p>
                          <p className="text-xs text-gray-500">{a.class_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => unassignMutation.mutate({ teacher_id: a.teacher_id, class_id: a.class_id })}
                        disabled={unassignMutation.isPending}
                        className="p-1.5 hover:bg-red-50 rounded-lg"
                        title="Remove assignment"
                      >
                        <Trash2 size={13} className="text-red-500" />
                      </button>
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
