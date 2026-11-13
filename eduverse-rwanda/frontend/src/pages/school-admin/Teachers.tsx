import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Search, Edit, Trash2, X, Loader2, Users, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

const empty = {
  first_name: '', last_name: '', email: '', phone: '', gender: 'male',
  employee_id: '', qualification: '', specialization: '',
  employment_type: 'full_time', join_date: '',
}

export default function SchoolTeachers() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'classes'>('info')
  const [form, setForm] = useState({ ...empty })
  const [newAssign, setNewAssign] = useState({ class_id: '', subject_id: '', subject_input: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data.data || []),
    retry: false,
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
    retry: false,
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data || []),
    retry: false,
  })

  const { data: teacherSubjects, refetch: refetchSubjects } = useQuery({
    queryKey: ['teacher-subjects', editData?.id],
    queryFn: () => api.get(`/teachers/${editData.id}/subjects`).then(r => r.data.data || []),
    enabled: !!editData?.id,
  })

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/teachers', payload),
    onSuccess: () => {
      toast.success(t('teachersPage.addTeacher') + '!')
      qc.invalidateQueries({ queryKey: ['teachers'] })
      closeModal()
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t('common.noData')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: any) => api.put(`/teachers/${id}`, payload),
    onSuccess: () => {
      toast.success(t('common.update') + '!')
      qc.invalidateQueries({ queryKey: ['teachers'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t('common.noData')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/teachers/${id}`),
    onSuccess: () => { toast.success(t('common.delete') + '!'); qc.invalidateQueries({ queryKey: ['teachers'] }) },
    onError: () => toast.error(t('common.noData')),
  })

  const assignMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/teachers/${editData.id}/subjects`, payload),
    onSuccess: () => {
      toast.success(t('teachersPage.assign') + '!')
      refetchSubjects()
      setNewAssign({ class_id: '', subject_id: '', subject_input: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || t('common.noData')),
  })

  const removeMutation = useMutation({
    mutationFn: (payload: any) => api.delete(`/teachers/${editData.id}/subjects`, { data: payload }),
    onSuccess: () => { toast.success(t('common.delete') + '!'); refetchSubjects() },
    onError: () => toast.error(t('common.noData')),
  })

  const teachers: any[] = (data || []).filter((teacher: any) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.specialization || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setEditData(null); setForm({ ...empty }); setActiveTab('info'); setShowModal(true) }
  const openEdit = (teacher: any) => {
    setEditData(teacher)
    setForm({
      first_name: teacher.first_name || '', last_name: teacher.last_name || '',
      email: teacher.email || '', phone: teacher.phone || '', gender: teacher.gender || 'male',
      employee_id: teacher.employee_id || '', qualification: teacher.qualification || '',
      specialization: teacher.specialization || '', employment_type: teacher.employment_type || 'full_time',
      join_date: teacher.join_date?.slice(0, 10) || '',
    })
    setActiveTab('info')
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditData(null); setForm({ ...empty }); setNewAssign({ class_id: '', subject_id: '', subject_input: '' }) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editData) updateMutation.mutate({ id: editData.id, payload: form })
    else createMutation.mutate(form)
  }

  const handleAssign = () => {
    if (!newAssign.class_id) return toast.error(t('teachersPage.selectClass'))
    if (!newAssign.subject_input.trim()) return toast.error(t('teachersPage.typeSubject'))
    const matched = (subjects || []).find((s: any) =>
      s.name.toLowerCase() === newAssign.subject_input.trim().toLowerCase()
    )
    if (!matched) return toast.error(`"${newAssign.subject_input}" ${t('common.noData')}`)
    assignMutation.mutate({ class_id: newAssign.class_id, subject_id: matched.id })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const tabItems = [
    { key: 'info', label: t('teachersPage.teacherInfo') },
    { key: 'classes', label: t('teachersPage.classAssignments') },
  ]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">{t('teachers.title')}</h1><p className="text-sm text-gray-500">{t('teachers.subtitle')}</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus size={15} /> {t('teachersPage.addTeacher')}</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: t('teachersPage.totalTeachers'), val: (data || []).length, color: 'text-green-600' },
          { label: t('teachersPage.fullTime'), val: (data || []).filter((tc: any) => tc.employment_type === 'full_time').length, color: 'text-blue-600' },
          { label: t('teachersPage.partTime'), val: (data || []).filter((tc: any) => tc.employment_type === 'part_time').length, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('teachersPage.searchPlaceholder')} className="input pl-9" />
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <Users size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">{t('teachersPage.noTeachers')}</p>
            <button onClick={openCreate} className="btn-primary mt-3 text-xs py-1.5"><Plus size={13} /> {t('teachersPage.addFirst')}</button>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">{t('teachersPage.teacher')}</th>
                <th className="table-header">{t('teachersPage.employeeId')}</th>
                <th className="table-header">{t('teachersPage.specialization')}</th>
                <th className="table-header">{t('teachersPage.department')}</th>
                <th className="table-header">{t('teachersPage.type')}</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher: any) => (
                <tr key={teacher.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">
                        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{teacher.first_name} {teacher.last_name}</p>
                        <p className="text-xs text-gray-400">{teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{teacher.employee_id || '—'}</td>
                  <td className="table-cell">
                    {teacher.specialization ? <span className="badge bg-purple-100 text-purple-600">{teacher.specialization}</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="table-cell text-gray-500">{teacher.department_name || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${teacher.employment_type === 'full_time' ? 'bg-blue-100 text-blue-600' : teacher.employment_type === 'part_time' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                      {teacher.employment_type?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(teacher)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={t('common.edit')}>
                        <Edit size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`${t('teachersPage.removeConfirm')} ${teacher.first_name} ${teacher.last_name}?`)) deleteMutation.mutate(teacher.id) }}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editData ? `${editData.first_name} ${editData.last_name}` : t('teachersPage.addTeacher')}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-500" /></button>
            </div>

            {editData && (
              <div className="flex border-b border-gray-100 px-6">
                {tabItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key as any)}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === item.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'info' && (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('teachersPage.firstNameLabel')} *</label>
                    <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required className="input" placeholder="Marie" />
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.lastNameLabel')} *</label>
                    <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required className="input" placeholder="Uwimana" />
                  </div>
                  {!editData && (
                    <div className="col-span-2">
                      <label className="label">{t('teachersPage.emailLabel')} *</label>
                      <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className="input" placeholder="teacher@school.rw" />
                    </div>
                  )}
                  <div>
                    <label className="label">{t('teachersPage.phoneLabel')}</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="+250 788 000 000" />
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.genderLabel')}</label>
                    <select value={form.gender} onChange={e => set('gender', e.target.value)} className="input">
                      <option value="male">{t('common.male')}</option>
                      <option value="female">{t('common.female')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.employeeIdLabel')}</label>
                    <input value={form.employee_id} onChange={e => set('employee_id', e.target.value)} className="input" placeholder="EMP-001" />
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.qualificationLabel')}</label>
                    <input value={form.qualification} onChange={e => set('qualification', e.target.value)} className="input" placeholder="B.Ed Mathematics" />
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.specializationLabel')}</label>
                    <input value={form.specialization} onChange={e => set('specialization', e.target.value)} className="input" placeholder="Mathematics" />
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.employmentTypeLabel')}</label>
                    <select value={form.employment_type} onChange={e => set('employment_type', e.target.value)} className="input">
                      <option value="full_time">{t('teachersPage.fullTimeOption')}</option>
                      <option value="part_time">{t('teachersPage.partTimeOption')}</option>
                      <option value="contract">{t('teachersPage.contractOption')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t('teachersPage.joinDateLabel')}</label>
                    <input type="date" value={form.join_date} onChange={e => set('join_date', e.target.value)} className="input" />
                  </div>
                </div>
                {!editData && <p className="text-xs text-gray-400">{t('teachersPage.defaultPassword')} <span className="font-mono font-medium">Teacher@123</span></p>}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="btn-secondary">{t('common.cancel')}</button>
                  <button type="submit" disabled={isPending} className="btn-primary px-6">
                    {isPending ? <><Loader2 size={15} className="animate-spin" /> {t('teachersPage.saving')}</> : editData ? t('teachersPage.saveChanges') : t('teachersPage.addTeacher')}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'classes' && editData && (
              <div className="px-6 py-5 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">{t('teachersPage.assignClassSubject')}</p>
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={newAssign.class_id}
                      onChange={e => setNewAssign(a => ({ ...a, class_id: e.target.value }))}
                      className="input flex-1 min-w-[140px]"
                    >
                      <option value="">{t('teachersPage.selectClass')}</option>
                      {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="relative flex-1 min-w-[140px]">
                      <input
                        list={`subjects-${editData?.id}`}
                        value={newAssign.subject_input}
                        onChange={e => setNewAssign(a => ({ ...a, subject_input: e.target.value }))}
                        className="input w-full"
                        placeholder={t('teachersPage.typeSubject')}
                      />
                      <datalist id={`subjects-${editData?.id}`}>
                        {(subjects || []).map((s: any) => <option key={s.id} value={s.name} />)}
                      </datalist>
                    </div>
                    <button onClick={handleAssign} disabled={assignMutation.isPending} className="btn-primary px-4">
                      {assignMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                      {t('teachersPage.assign')}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    {t('teachersPage.currentAssignments')}
                    <span className="ml-2 badge bg-gray-100 text-gray-500">{(teacherSubjects || []).length}</span>
                  </p>
                  {(teacherSubjects || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                      <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                      {t('teachersPage.noAssignments')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(teacherSubjects || []).map((ts: any) => (
                        <div key={`${ts.class_id}-${ts.subject_id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen size={14} className="text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{ts.class_name}</p>
                              <p className="text-xs text-gray-400">{ts.subject_name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { if (confirm(`${t('teachersPage.removeConfirm')} ${ts.subject_name} ${t('teachersPage.from')} ${ts.class_name}?`)) removeMutation.mutate({ class_id: ts.class_id, subject_id: ts.subject_id }) }}
                            disabled={removeMutation.isPending}
                            className="p-1.5 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <button onClick={closeModal} className="btn-secondary">{t('teachersPage.done')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
