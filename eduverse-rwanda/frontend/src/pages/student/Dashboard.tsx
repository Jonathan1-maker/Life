import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { BookOpen, ClipboardList, TrendingUp, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: assignments } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => api.get('/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data.data || []),
    retry: false,
  })

  const { data: courses } = useQuery({
    queryKey: ['student-courses'],
    queryFn: () => api.get('/courses').then(r => r.data.data || []),
    retry: false,
  })

  const pending = (assignments || []).filter((a: any) => {
    // check if student submitted
    return !a.submitted
  }).length

  const priorityColor: Record<string, string> = {
    urgent: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    normal: 'border-l-blue-500 bg-blue-50',
    low: 'border-l-gray-300 bg-gray-50',
  }

  const quickAccess = [
    { label: 'Results', icon: '📊', path: '/student/results' },
    { label: 'Assignments', icon: '📝', path: '/student/assignments' },
    { label: 'Courses', icon: '📚', path: '/student/courses' },
    { label: 'Timetable', icon: '📅', path: '/student/timetable' },
  ]

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-500">Welcome to your dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Courses', val: (courses || []).length, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
          { label: 'Assignments Due', val: pending, icon: ClipboardList, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Assignments', val: (assignments || []).length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Announcements', val: (announcements || []).length, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Quick access */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickAccess.map(q => (
              <button key={q.label} onClick={() => navigate(q.path)} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 hover:text-primary-700 transition-colors text-left">
                <span className="text-2xl">{q.icon}</span>
                <span className="text-sm font-medium text-gray-700">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Announcements from DB */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Announcements</h3>
          {(announcements || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No announcements</p>
          ) : (
            <div className="space-y-3">
              {(announcements || []).slice(0, 4).map((a: any) => (
                <div key={a.id} className={`p-3 rounded-lg border-l-4 ${priorityColor[a.priority] || priorityColor.normal}`}>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent assignments */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Recent Assignments</h3>
          <button onClick={() => navigate('/student/assignments')} className="text-xs text-primary-600 font-medium hover:underline">View all</button>
        </div>
        {(assignments || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No assignments yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {(assignments || []).slice(0, 4).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={15} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.subject_name} · Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</p>
                </div>
                <span className="badge bg-orange-100 text-orange-600 text-xs flex-shrink-0">{a.class_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
