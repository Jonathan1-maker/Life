import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const PERIODS = [
  { index: 0,  label: 'Assembly',    time: '8:30 – 8:45',   fixed: true  },
  { index: 1,  label: 'Period 1',    time: '8:45 – 9:25',   fixed: false },
  { index: 2,  label: 'Period 2',    time: '9:25 – 10:05',  fixed: false },
  { index: 3,  label: 'Period 3',    time: '10:05 – 10:45', fixed: false },
  { index: 4,  label: 'Morning Break', time: '10:45 – 11:00', fixed: true },
  { index: 5,  label: 'Period 4',    time: '11:00 – 11:40', fixed: false },
  { index: 6,  label: 'Period 5',    time: '11:40 – 12:20', fixed: false },
  { index: 7,  label: 'Lunch Break', time: '12:20 – 13:25', fixed: true  },
  { index: 8,  label: 'Period 6',    time: '13:25 – 14:05', fixed: false },
  { index: 9,  label: 'Period 7',    time: '14:05 – 14:45', fixed: false },
  { index: 10, label: 'Period 8',    time: '14:45 – 15:25', fixed: false },
  { index: 11, label: 'Afternoon Break', time: '15:25 – 15:40', fixed: true },
  { index: 12, label: 'Period 9',    time: '15:40 – 16:20', fixed: false },
  { index: 13, label: 'Remedial / Extra', time: '16:20 – 17:00', fixed: true },
]

const CELL_COLORS = [
  'bg-blue-50 border-blue-300 text-blue-800',
  'bg-green-50 border-green-300 text-green-800',
  'bg-purple-50 border-purple-300 text-purple-800',
  'bg-orange-50 border-orange-300 text-orange-800',
  'bg-teal-50 border-teal-300 text-teal-800',
  'bg-pink-50 border-pink-300 text-pink-800',
  'bg-yellow-50 border-yellow-300 text-yellow-800',
]

function colorFor(subjectId: string) {
  let h = 0
  for (let i = 0; i < subjectId.length; i++) h = (h * 31 + subjectId.charCodeAt(i)) >>> 0
  return CELL_COLORS[h % CELL_COLORS.length]
}

export default function SchoolTimetable() {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('')
  const [editing, setEditing] = useState<{ day: string; period: number } | null>(null)
  const [slotForm, setSlotForm] = useState({ teacher_id: '', subject_id: '' })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data.data || []),
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get('/subjects').then(r => r.data.data || []),
  })

  const { data: slots } = useQuery({
    queryKey: ['timetable', classId],
    queryFn: () => api.get(`/timetable?class_id=${classId}`).then(r => r.data.data || []),
    enabled: !!classId,
  })

  // Build lookup: day+period → slot
  const slotMap: Record<string, any> = {}
  for (const s of (slots || [])) slotMap[`${s.day}-${s.period}`] = s

  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put('/timetable', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable', classId] })
      toast.success('Slot saved!')
      setEditing(null)
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (body: any) => api.delete('/timetable', { data: body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable', classId] })
      toast.success('Slot cleared')
    },
    onError: () => toast.error('Failed to clear slot'),
  })

  const openEdit = (day: string, period: number) => {
    const existing = slotMap[`${day}-${period}`]
    setSlotForm({ teacher_id: existing?.teacher_id || '', subject_id: existing?.subject_id || '' })
    setEditing({ day, period })
  }

  const handleSave = () => {
    if (!slotForm.teacher_id || !slotForm.subject_id) return toast.error('Select teacher and subject')
    saveMutation.mutate({ class_id: classId, ...slotForm, day: editing!.day, period: editing!.period })
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="text-sm text-gray-500">Build class schedules — teachers can't be double-booked</p>
        </div>
        <select className="input w-48" value={classId} onChange={e => setClassId(e.target.value)}>
          <option value="">Select class</option>
          {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!classId ? (
        <div className="card p-12 text-center text-gray-400 text-sm">Select a class to view or edit its timetable</div>
      ) : (
        <div className="card overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 w-36">Period</th>
                <th className="border border-gray-200 px-2 py-2 text-left font-semibold text-gray-600 w-28">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="border border-gray-200 px-2 py-2 text-center font-semibold text-gray-600">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(p => (
                <tr key={p.index} className={p.fixed ? 'bg-gray-50' : 'hover:bg-gray-50/50'}>
                  <td className="border border-gray-200 px-3 py-1.5 font-medium text-gray-700">{p.label}</td>
                  <td className="border border-gray-200 px-2 py-1.5 text-gray-400 whitespace-nowrap">{p.time}</td>
                  {DAYS.map(day => {
                    if (p.fixed) return (
                      <td key={day} className="border border-gray-200 px-2 py-1.5 text-center text-gray-300">—</td>
                    )
                    const slot = slotMap[`${day}-${p.index}`]
                    return (
                      <td key={day} className="border border-gray-200 p-1">
                        {slot ? (
                          <div className={`rounded border p-1.5 flex flex-col gap-0.5 relative group ${colorFor(slot.subject_id)}`}>
                            <span className="font-semibold leading-tight">{slot.subject_name}</span>
                            <span className="opacity-70 leading-tight">{slot.teacher_name}</span>
                            <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                              <button onClick={() => openEdit(day, p.index)}
                                className="w-4 h-4 bg-white rounded text-gray-500 hover:text-blue-600 flex items-center justify-center text-[10px] border">✎</button>
                              <button onClick={() => deleteMutation.mutate({ class_id: classId, day, period: p.index })}
                                className="w-4 h-4 bg-white rounded text-gray-500 hover:text-red-600 flex items-center justify-center border">
                                <X size={8} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => openEdit(day, p.index)}
                            className="w-full h-9 rounded border border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 text-gray-300 hover:text-primary-400 transition-colors flex items-center justify-center">
                            +
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                {editing.day} — {PERIODS.find(p => p.index === editing.period)?.label}
              </h3>
              <button onClick={() => setEditing(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div>
              <label className="label">Subject</label>
              <select className="input" value={slotForm.subject_id} onChange={e => setSlotForm(f => ({ ...f, subject_id: e.target.value }))}>
                <option value="">Select subject</option>
                {(subjects || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Teacher</label>
              <select className="input" value={slotForm.teacher_id} onChange={e => setSlotForm(f => ({ ...f, teacher_id: e.target.value }))}>
                <option value="">Select teacher</option>
                {(teachers || []).map((t: any) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary flex-1">
                {saveMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
