import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Save, Plus, Trash2, X, Loader2, CheckCircle2, BookOpen, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { title: '', type: 'exam', total_marks: '100', date: '', subject_id: '', term_id: '' }

const getGrade = (score: number, total: number) => {
  const pct = total ? (score / total) * 100 : 0
  if (pct >= 70) return { grade: 'A', color: 'text-green-600',  bg: 'bg-green-100',  label: 'Excellent' }
  if (pct >= 65) return { grade: 'B', color: 'text-blue-600',   bg: 'bg-blue-100',   label: 'Very Good' }
  if (pct >= 60) return { grade: 'C', color: 'text-teal-600',   bg: 'bg-teal-100',   label: 'Good' }
  if (pct >= 50) return { grade: 'D', color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Satisfactory' }
  if (pct >= 40) return { grade: 'E', color: 'text-orange-500', bg: 'bg-orange-100', label: 'Adequate' }
  return              { grade: 'F', color: 'text-red-600',    bg: 'bg-red-100',    label: 'Fail' }
}

export default function TeacherMarks() {
  const qc = useQueryClient()

  const [selectedTermId, setSelectedTermId] = useState('')
  const [selectedClass, setSelectedClass]   = useState('')
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [marks, setMarks]           = useState<Record<string, string>>({})
  const [savedMark, setSavedMark]   = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState({ ...emptyForm })

  /* ── data ── */
  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data.data || []),
    retry: false,
  })

  const { data: schoolSettings } = useQuery({
    queryKey: ['school-settings'],
    queryFn: () => api.get('/schools/my').then(r => r.data.data?.settings || {}),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 10000,
  })
  const marksLocked = !!schoolSettings?.marks_locked

  const { data: myData } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/teachers/my/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const classes = [
    ...new Map(
      (myData || []).map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])
    ).values(),
  ] as { id: string; name: string }[]

  const subjectsForClass = (myData || []).filter((a: any) => a.class_id === selectedClass)
  const assignedSubjectIds: string[] = subjectsForClass.map((a: any) => a.subject_id)

  const { data: assessments, refetch: refetchAssessments } = useQuery({
    queryKey: ['assessments', selectedClass, selectedTermId, assignedSubjectIds.join(',')],
    queryFn: () =>
      api.get(`/assessments?class_id=${selectedClass}${selectedTermId ? `&term_id=${selectedTermId}` : ''}`)
        .then(r => (r.data.data || []).filter((a: any) => assignedSubjectIds.includes(a.subject_id))),
    enabled: !!selectedClass && !!selectedTermId && assignedSubjectIds.length > 0,
  })

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-class', selectedClass],
    queryFn: () => api.get(`/students?class_id=${selectedClass}`).then(r => r.data.data || []),
    enabled: !!selectedClass,
  })

  const { isFetching: loadingMarks } = useQuery({
    queryKey: ['marks-assessment', selectedAssessment],
    queryFn: async () => {
      const { data } = await api.get(`/marks/assessment/${selectedAssessment}`)
      const map: Record<string, string> = {}
      ;(data.data || []).forEach((m: any) => { map[m.student_id] = String(m.marks_obtained ?? '') })
      setMarks(map)
      setSavedMark((data.data || []).length > 0)
      return data.data
    },
    enabled: !!selectedAssessment,
    staleTime: 0,
    gcTime: 0,
  })

  /* ── mutations ── */
  const createAssessmentMutation = useMutation({
    mutationFn: (payload: any) => api.post('/assessments', payload),
    onSuccess: () => {
      toast.success('Assessment created!')
      qc.invalidateQueries({ queryKey: ['assessments', selectedClass, selectedTermId, assignedSubjectIds.join(',')] })
      refetchAssessments()
      setShowCreate(false)
      setForm({ ...emptyForm })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create assessment'),
  })

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/assessments/${id}`),
    onSuccess: () => {
      toast.success('Assessment deleted')
      setSelectedAssessment('')
      setMarks({})
      setSavedMark(false)
      qc.invalidateQueries({ queryKey: ['assessments', selectedClass, selectedTermId, assignedSubjectIds.join(',')] })
    },
    onError: () => toast.error('Failed to delete'),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post('/marks', {
        assessment_id: selectedAssessment,
        marks: (students || []).map((s: any) => ({
          student_id:     s.id,
          marks_obtained: parseFloat(marks[s.id] || '0'),
          remarks:        '',
        })),
      }),
    onSuccess: () => {
      toast.success('Marks saved!')
      setSavedMark(true)
      qc.invalidateQueries({ queryKey: ['marks-assessment', selectedAssessment] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save marks'),
  })

  const assessment = (assessments || []).find((a: any) => a.id === selectedAssessment)
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClass)   return toast.error('Select a class first')
    if (!form.subject_id) return toast.error('Select a subject')
    createAssessmentMutation.mutate({
      ...form,
      class_id:    selectedClass,
      term_id:     form.term_id || selectedTermId || null,
      total_marks: parseFloat(form.total_marks) || 100,
    })
  }

  const handleClassChange = (cid: string) => {
    setSelectedClass(cid)
    setSelectedAssessment('')
    setMarks({})
    setSavedMark(false)
  }

  const handleAssessmentChange = (aid: string) => {
    setSelectedAssessment(aid)
    setSavedMark(false)
  }

  /* ── render ── */
  return (
    <div className="space-y-6 fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Marks</h1>
          <p className="text-sm text-gray-500">Manage assessments and enter student marks</p>
        </div>
        {selectedClass && selectedTermId && !marksLocked && (
          <button onClick={() => setShowCreate(true)} className="btn-secondary">
            <Plus size={15} /> New Assessment
          </button>
        )}
      </div>

      {/* Locked banner */}
      {marksLocked && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <Lock size={18} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Marks Entry is Locked</p>
            <p className="text-xs mt-0.5">The school administrator has locked marks entry. Contact your admin to unlock it.</p>
          </div>
        </div>
      )}

      {/* STEP 1: Term selector */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">1</div>
          <h3 className="section-title">Select Term</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(terms || []).map((t: any) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTermId(t.id); setSelectedAssessment(''); setMarks({}); setSavedMark(false) }}
              className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                selectedTermId === t.id
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-sm">{t.name}</p>
              {t.year_name && <p className="text-xs opacity-70 mt-0.5">{t.year_name}</p>}
            </button>
          ))}
          {(terms || []).length === 0 && (
            <p className="text-sm text-gray-400 col-span-4">No terms found — ask your admin to create terms first.</p>
          )}
        </div>
      </div>

      {/* STEP 2 & 3: Class + Assessment */}
      {selectedTermId && (
        <div className="card p-4 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-3 w-full mb-1">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">2</div>
            <h3 className="section-title">Select Class &amp; Assessment</h3>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="label">Class</label>
            <select className="input" value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="label">Assessment</label>
            <select
              className="input"
              value={selectedAssessment}
              onChange={e => handleAssessmentChange(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select assessment</option>
              {(assessments || []).map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.title} — {a.subject_name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {selectedAssessment && (
            <button
              onClick={() => { if (confirm('Delete this assessment and all its marks?')) deleteAssessmentMutation.mutate(selectedAssessment) }}
              className="btn-danger py-2.5"
              title="Delete assessment"
            >
              <Trash2 size={15} />
            </button>
          )}

          {selectedClass && (assessments || []).length === 0 && (
            <p className="text-xs text-gray-400 w-full">
              No assessments for this term &amp; class yet.{' '}
              {!marksLocked && <button onClick={() => setShowCreate(true)} className="text-primary-600 underline font-medium">Create one</button>}
            </p>
          )}
        </div>
      )}

      {/* Prompt when no term selected */}
      {!selectedTermId && (
        <div className="card flex items-center justify-center h-32 gap-3">
          <BookOpen size={20} className="text-gray-300" />
          <p className="text-sm text-gray-400">Select a term above to get started</p>
        </div>
      )}

      {/* Marks table */}
      {selectedAssessment && (
        <div className="card overflow-x-auto">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{assessment?.title}</span>
              <span className="badge bg-purple-100 text-purple-600">{assessment?.subject_name}</span>
              <span className="badge bg-gray-100 text-gray-600 capitalize">{assessment?.type}</span>
              {savedMark && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle2 size={13} /> Marks saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Total: <strong>{assessment?.total_marks}</strong> marks</span>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || (students || []).length === 0 || marksLocked}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                {saveMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Save size={14} /> {savedMark ? 'Update Marks' : 'Save Marks'}</>}
              </button>
            </div>
          </div>

          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Student</th>
                <th className="table-header">Score / {assessment?.total_marks ?? '—'}</th>
                <th className="table-header">Grade</th>
                <th className="table-header">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loadingStudents || loadingMarks ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <Loader2 className="animate-spin w-6 h-6 text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : (students || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No students in this class</td>
                </tr>
              ) : (
                (students || []).map((s: any, i: number) => {
                  const score = parseFloat(marks[s.id] || '0')
                  const { grade, color, bg, label } = getGrade(score, assessment?.total_marks)
                  const hasScore = marks[s.id] !== undefined && marks[s.id] !== ''
                  return (
                    <tr key={s.id} className="table-row">
                      <td className="table-cell text-gray-400">{i + 1}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </div>
                          <span className="font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="table-cell w-36">
                        <input
                          type="number"
                          min="0"
                          max={assessment?.total_marks ?? 100}
                          value={marks[s.id] ?? ''}
                          onChange={e => { setMarks(m => ({ ...m, [s.id]: e.target.value })); setSavedMark(false) }}
                          className="input w-24 text-center"
                          placeholder="0"
                          disabled={marksLocked}
                        />
                      </td>
                      <td className="table-cell">
                        <span className={`font-bold text-lg ${color}`}>{hasScore ? grade : '—'}</span>
                      </td>
                      <td className="table-cell">
                        {hasScore ? (
                          <span className={`badge text-xs ${bg} ${color}`}>{label}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {(students || []).length > 5 && (
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || marksLocked}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                {saveMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Save size={14} /> {savedMark ? 'Update Marks' : 'Save Marks'}</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Assessment</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateAssessment} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  required
                  className="input"
                  placeholder="e.g. Term 1 Mathematics Exam"
                />
              </div>

              <div>
                <label className="label">Term</label>
                <select
                  value={form.term_id || selectedTermId}
                  onChange={e => set('term_id', e.target.value)}
                  className="input"
                >
                  <option value="">No term</option>
                  {(terms || []).map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.year_name ? `${t.year_name} — ` : ''}{t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Subject *</label>
                  <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} required className="input">
                    <option value="">Select subject</option>
                    {subjectsForClass.map((s: any) => (
                      <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Type *</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className="input">
                    <option value="exam">Exam</option>
                    <option value="cat">CAT</option>
                    <option value="test">Test</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="label">Total Marks *</label>
                  <input
                    type="number"
                    value={form.total_marks}
                    onChange={e => set('total_marks', e.target.value)}
                    required className="input" placeholder="100" min="1"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" />
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createAssessmentMutation.isPending} className="btn-primary px-6">
                  {createAssessmentMutation.isPending
                    ? <><Loader2 size={15} className="animate-spin" /> Creating…</>
                    : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
