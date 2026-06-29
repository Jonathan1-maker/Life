import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { BookOpen, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TeacherClasses() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/teachers/my/assignments').then(r => r.data.data || []),
    retry: false,
  })

  // group by class
  const classMap: Record<string, any> = {}
  ;(data || []).forEach((a: any) => {
    if (!classMap[a.class_id]) {
      classMap[a.class_id] = { class_id: a.class_id, class_name: a.class_name, student_count: a.student_count, subjects: [] }
    }
    classMap[a.class_id].subjects.push(a.subject_name)
  })
  const classes = Object.values(classMap)

  return (
    <div className="space-y-6 fade-in">
      <div><h1 className="page-title">My Classes</h1><p className="text-sm text-gray-500">Classes you are currently teaching</p></div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : classes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <BookOpen size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No classes assigned yet — contact your school admin</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {classes.map((c: any) => (
            <div key={c.class_id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.class_name}</h3>
                    <p className="text-xs text-gray-400">{c.subjects.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Users size={14} />{c.student_count}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => navigate('/teacher/attendance')}
                  className="btn-primary flex-1 justify-center text-xs py-1.5"
                >
                  Take Attendance
                </button>
                <button
                  onClick={() => navigate('/teacher/marks')}
                  className="btn-secondary flex-1 justify-center text-xs py-1.5"
                >
                  Enter Marks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
