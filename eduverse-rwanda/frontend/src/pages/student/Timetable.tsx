import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { BookOpen } from 'lucide-react'

export default function StudentTimetable() {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => api.get(`/students/${user?.id}`).then(r => r.data.data),
    enabled: !!user?.id,
    retry: false,
  })

  const { data: subjects } = useQuery({
    queryKey: ['class-subjects', profile?.class_id],
    queryFn: () => api.get('/subjects').then(r => r.data.data || []),
    enabled: !!profile?.class_id,
    retry: false,
  })

  const { data: teachers } = useQuery({
    queryKey: ['class-teachers', profile?.class_id],
    queryFn: () => api.get(`/teachers`).then(r => r.data.data || []),
    enabled: !!profile?.class_id,
    retry: false,
  })

  // Build subject-teacher map from teacher_subjects
  const { data: assignments } = useQuery({
    queryKey: ['all-teacher-assignments'],
    queryFn: async () => {
      const res = await Promise.all(
        (teachers || []).map((t: any) => api.get(`/teachers/${t.id}/subjects`).then(r => r.data.data || []))
      )
      return res.flat()
    },
    enabled: !!(teachers && teachers.length > 0 && profile?.class_id),
    retry: false,
  })

  const classSubjects = (assignments || []).filter((a: any) => a.class_id === profile?.class_id)

  const colors = [
    'bg-blue-50 border-blue-200 text-blue-700',
    'bg-green-50 border-green-200 text-green-700',
    'bg-purple-50 border-purple-200 text-purple-700',
    'bg-orange-50 border-orange-200 text-orange-700',
    'bg-teal-50 border-teal-200 text-teal-700',
    'bg-pink-50 border-pink-200 text-pink-700',
  ]

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Timetable</h1>
        <p className="text-sm text-gray-500">
          {profile?.class_name ? `Class: ${profile.class_name}` : 'Your class schedule'}
        </p>
      </div>

      {!profile?.class_id ? (
        <div className="card flex items-center justify-center h-40">
          <p className="text-sm text-gray-400">You are not assigned to a class yet</p>
        </div>
      ) : classSubjects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <BookOpen size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No subjects assigned to your class yet</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classSubjects.map((s: any, i: number) => (
              <div key={`${s.class_id}-${s.subject_id}`} className={`card p-4 border ${colors[i % colors.length]}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <BookOpen size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{s.subject_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.class_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-4">Subject Summary</h3>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Class</th>
                </tr>
              </thead>
              <tbody>
                {classSubjects.map((s: any) => (
                  <tr key={`${s.class_id}-${s.subject_id}`} className="table-row">
                    <td className="table-cell font-medium text-gray-800">{s.subject_name}</td>
                    <td className="table-cell text-gray-500">{s.class_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
