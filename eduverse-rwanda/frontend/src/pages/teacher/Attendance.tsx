import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

type Status = 'present' | 'absent' | 'late' | 'excused'

export default function TeacherAttendance() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [date, setDate] = useState(today)
  const [attendance, setAttendance] = useState<Record<string, Status>>({})

  const { data: myData } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/teachers/my/assignments').then(r => r.data.data || []),
    retry: false,
  })

  // unique classes
  const classes = [...new Map((myData || []).map((a: any) => [a.class_id, { id: a.class_id, name: a.class_name }])).values()]
  // subjects for selected class
  const subjects = (myData || []).filter((a: any) => a.class_id === selectedClass)

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-class', selectedClass],
    queryFn: () => api.get(`/students?class_id=${selectedClass}`).then(r => r.data.data || []),
    enabled: !!selectedClass,
  })

  // load existing attendance for this class+date
  useQuery({
    queryKey: ['attendance-class', selectedClass, date],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/class?class_id=${selectedClass}&date=${date}`)
      const map: Record<string, Status> = {}
      ;(data.data || []).forEach((r: any) => { map[r.user_id] = r.status })
      setAttendance(map)
      return data.data
    },
    enabled: !!selectedClass && !!date,
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post('/attendance', {
      class_id: selectedClass,
      subject_id: selectedSubject || null,
      date,
      records: (students || []).map((s: any) => ({
        user_id: s.id,
        status: attendance[s.id] || 'absent',
        remarks: '',
      })),
    }),
    onSuccess: () => toast.success('Attendance saved!'),
    onError: () => toast.error('Failed to save attendance'),
  })

  const mark = (id: string, status: Status) => setAttendance(a => ({ ...a, [id]: status }))
  const present = Object.values(attendance).filter(v => v === 'present').length
  const absent = Object.values(attendance).filter(v => v === 'absent').length
  const late = Object.values(attendance).filter(v => v === 'late').length

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Attendance</h1><p className="text-sm text-gray-500">Mark student attendance</p></div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input flex-1 min-w-[150px]" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); setAttendance({}) }}>
          <option value="">Select class</option>
          {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input flex-1 min-w-[150px]" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
          <option value="">Select subject (optional)</option>
          {subjects.map((s: any) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
        </select>
        <input type="date" className="input w-44" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {selectedClass && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Present', val: present, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Absent', val: absent, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Late', val: late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            ].map(s => (
              <div key={s.label} className={`card p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {(students || []).length} students
              </span>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !students?.length} className="btn-primary py-1.5 text-xs">
                <Save size={13} /> {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            {loadingStudents ? (
              <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
            ) : (students || []).length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No students in this class</p>
            ) : (
              (students || []).map((s: any, i: number) => (
                <div key={s.id} className={`flex items-center justify-between px-5 py-3 ${i < (students || []).length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{s.first_name} {s.last_name}</span>
                  </div>
                  <div className="flex gap-2">
                    {(['present', 'absent', 'late', 'excused'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => mark(s.id, status)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                          attendance[s.id] === status
                            ? status === 'present' ? 'bg-green-500 text-white'
                              : status === 'absent' ? 'bg-red-500 text-white'
                              : status === 'late' ? 'bg-yellow-500 text-white'
                              : 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!selectedClass && (
        <div className="card flex items-center justify-center h-40">
          <p className="text-sm text-gray-400">Select a class to mark attendance</p>
        </div>
      )}
    </div>
  )
}
