import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { ClipboardList, Clock, CheckCircle } from 'lucide-react'

export default function StudentAssignments() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: () => api.get('/assignments').then(r => r.data.data || []),
    retry: false,
  })

  const pending = (data || []).filter((a: any) => !a.status || a.status === 'pending')
  const submitted = (data || []).filter((a: any) => a.status === 'submitted')
  const graded = (data || []).filter((a: any) => a.status === 'graded')

  return (
    <div className="space-y-6 fade-in">
      <div><h1 className="page-title">Assignments</h1><p className="text-sm text-gray-500">Your assignments and submissions</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', val: pending.length, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Submitted', val: submitted.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
          { label: 'Graded', val: graded.length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={18} /></div>
            <div><p className="text-xs text-gray-400">{s.label}</p><p className="text-xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (data || []).length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-40 text-gray-300">
          <ClipboardList size={40} className="mb-2 opacity-40" />
          <p className="text-sm text-gray-400">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data || []).map((a: any) => (
            <div key={a.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{a.title}</p>
                <p className="text-xs text-gray-400">
                  {a.subject_name} · {a.class_name} · Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}
                </p>
              </div>
              {a.marks_obtained != null && (
                <span className="text-green-600 font-bold text-sm">{a.marks_obtained}/{a.total_marks}</span>
              )}
              <span className={`badge flex-shrink-0 ${a.status === 'graded' ? 'bg-green-100 text-green-600' : a.status === 'submitted' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {a.status || 'pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
