import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { BookOpen, Users, ClipboardList, TrendingUp } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const PERIODS = [
  { index: 0,  label: 'Assembly',        time: '8:30–8:45',   fixed: true  },
  { index: 1,  label: 'Period 1',        time: '8:45–9:25',   fixed: false },
  { index: 2,  label: 'Period 2',        time: '9:25–10:05',  fixed: false },
  { index: 3,  label: 'Period 3',        time: '10:05–10:45', fixed: false },
  { index: 4,  label: 'Morning Break',   time: '10:45–11:00', fixed: true  },
  { index: 5,  label: 'Period 4',        time: '11:00–11:40', fixed: false },
  { index: 6,  label: 'Period 5',        time: '11:40–12:20', fixed: false },
  { index: 7,  label: 'Lunch Break',     time: '12:20–13:25', fixed: true  },
  { index: 8,  label: 'Period 6',        time: '13:25–14:05', fixed: false },
  { index: 9,  label: 'Period 7',        time: '14:05–14:45', fixed: false },
  { index: 10, label: 'Period 8',        time: '14:45–15:25', fixed: false },
  { index: 11, label: 'Afternoon Break', time: '15:25–15:40', fixed: true  },
  { index: 12, label: 'Period 9',        time: '15:40–16:20', fixed: false },
  { index: 13, label: 'Remedial/Extra',  time: '16:20–17:00', fixed: true  },
]

const COLORS = [
  'bg-blue-50 border-blue-300 text-blue-800',
  'bg-green-50 border-green-300 text-green-800',
  'bg-purple-50 border-purple-300 text-purple-800',
  'bg-orange-50 border-orange-300 text-orange-800',
  'bg-teal-50 border-teal-300 text-teal-800',
  'bg-pink-50 border-pink-300 text-pink-800',
]
const colorFor = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export default function TeacherDashboard() {
  const { user } = useAuth()

  const { data: assignments } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/teachers/my/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const { data: myAssignments } = useQuery({
    queryKey: ['assignments-teacher'],
    queryFn: () => api.get('/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const { data: myTimetable } = useQuery({
    queryKey: ['my-timetable'],
    queryFn: () => api.get('/timetable/mine').then(r => r.data.data || []),
    retry: false,
    refetchInterval: 10000,
  })

  const slotMap: Record<string, any> = {}
  for (const s of (myTimetable || [])) slotMap[`${s.day}-${s.period}`] = s

  const classes = [...new Map((assignments || []).map((a: any) => [a.class_id, a])).values()]
  const uniqueStudents = [...new Map((assignments || []).map((a: any) => [a.class_id, a.student_count])).values()]
    .reduce((sum: number, c: any) => sum + parseInt(c || 0), 0)

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-500">Here's your teaching overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Classes',   val: classes.length,              icon: BookOpen,     color: 'text-blue-600 bg-blue-50'   },
          { label: 'Students',     val: uniqueStudents,               icon: Users,        color: 'text-green-600 bg-green-50' },
          { label: 'Subjects',     val: (assignments || []).length,   icon: ClipboardList,color: 'text-purple-600 bg-purple-50'},
          { label: 'Assignments',  val: (myAssignments || []).length, icon: TrendingUp,   color: 'text-orange-600 bg-orange-50'},
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* My Timetable */}
      <div className="card overflow-auto">
        <div className="p-4 border-b border-gray-100">
          <h3 className="section-title">My Timetable</h3>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 w-32">Period</th>
              <th className="border border-gray-200 px-2 py-2 text-left font-semibold text-gray-600 w-24">Time</th>
              {DAYS.map(d => (
                <th key={d} className="border border-gray-200 px-2 py-2 text-center font-semibold text-gray-600">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(p => (
              <tr key={p.index} className={p.fixed ? 'bg-gray-50' : ''}>
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
                        <div className={`rounded border p-1.5 flex flex-col gap-0.5 ${colorFor(slot.subject_id)}`}>
                          <span className="font-semibold leading-tight">{slot.subject_name}</span>
                          <span className="opacity-70 leading-tight">{slot.class_name}</span>
                        </div>
                      ) : (
                        <div className="h-8 flex items-center justify-center text-gray-200">—</div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* My classes & subjects */}
        <div className="card p-5">
          <h3 className="section-title mb-4">My Classes & Subjects</h3>
          {(assignments || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No classes assigned yet</p>
          ) : (
            <div className="space-y-3">
              {(assignments || []).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{a.subject_name}</p>
                    <p className="text-xs text-gray-400">{a.class_name}</p>
                  </div>
                  <span className="badge bg-blue-100 text-blue-600">{a.student_count} students</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent assignments */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Recent Assignments</h3>
          {(myAssignments || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No assignments created yet</p>
          ) : (
            <div className="space-y-3">
              {(myAssignments || []).slice(0, 5).map((a: any) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                    <span className="badge bg-blue-100 text-blue-600 text-xs">{a.class_name}</span>
                  </div>
                  <p className="text-xs text-gray-400">{a.subject_name} · Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
