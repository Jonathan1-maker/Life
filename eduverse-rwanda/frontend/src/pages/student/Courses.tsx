import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { BookOpen } from 'lucide-react'

export default function StudentCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: () => api.get('/courses').then(r => r.data.data || []),
    retry: false,
  })

  const colors = [
    'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200',
    'bg-teal-50 border-teal-200', 'bg-orange-50 border-orange-200', 'bg-pink-50 border-pink-200',
  ]

  return (
    <div className="space-y-6 fade-in">
      <div><h1 className="page-title">My Courses</h1><p className="text-sm text-gray-500">Your current subjects and materials</p></div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (data || []).length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <BookOpen size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No courses available yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data || []).map((c: any, i: number) => (
            <div key={c.id} className={`card p-5 border ${colors[i % colors.length]} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white rounded-xl border flex items-center justify-center shadow-sm">
                  <BookOpen size={18} className="text-primary-600" />
                </div>
                <span className={`badge ${c.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {c.is_published ? 'Active' : 'Draft'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <p className="text-xs text-gray-400 mb-1">{c.subject_name}</p>
              <p className="text-xs text-gray-400 mb-3">{c.teacher_name}</p>
              {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
