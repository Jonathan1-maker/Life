import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, Award } from 'lucide-react'

export default function StudentResults() {
  const { user } = useAuth()

  const { data: marks, isLoading } = useQuery({
    queryKey: ['student-marks', user?.id],
    queryFn: () => api.get(`/marks/student/${user?.id}`).then(r => r.data.data || []),
    enabled: !!user?.id,
    retry: false,
  })

  // group by subject
  const bySubject: Record<string, any[]> = {}
  ;(marks || []).forEach((m: any) => {
    if (!bySubject[m.subject_name]) bySubject[m.subject_name] = []
    bySubject[m.subject_name].push(m)
  })

  const subjectSummary = Object.entries(bySubject).map(([subject, entries]) => {
    const avg = Math.round(entries.reduce((s, e) => s + parseFloat(e.marks_obtained || 0), 0) / entries.length)
    return { subject, avg, grade: entries[entries.length - 1]?.grade || '—', entries }
  })

  const radarData = subjectSummary.map(s => ({ subject: s.subject.slice(0, 5), score: s.avg }))
  const overall = subjectSummary.length ? Math.round(subjectSummary.reduce((s, r) => s + r.avg, 0) / subjectSummary.length) : 0
  const aGrades = subjectSummary.filter(s => s.grade === 'A').length

  const gradeColor = (g: string) => {
    if (g === 'A') return 'text-green-600'
    if (g === 'B') return 'text-blue-600'
    if (g === 'C') return 'text-teal-600'
    if (g === 'D') return 'text-yellow-600'
    if (g === 'E') return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6 fade-in">
      <div><h1 className="page-title">Results</h1><p className="text-sm text-gray-500">Your academic performance</p></div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center"><Award size={20} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-400">Overall Average</p><p className="text-2xl font-bold text-gray-900">{overall ? `${overall}%` : '—'}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center"><TrendingUp size={20} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-400">Subjects</p><p className="text-2xl font-bold text-gray-900">{subjectSummary.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center"><span className="text-lg">🏆</span></div>
          <div><p className="text-xs text-gray-400">A Grades</p><p className="text-2xl font-bold text-gray-900">{aGrades}</p></div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : subjectSummary.length === 0 ? (
        <div className="card flex items-center justify-center h-40">
          <p className="text-sm text-gray-400">No results available yet</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="section-title mb-2">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-4">Subject Results</h3>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header pl-0">Subject</th>
                    <th className="table-header">Avg Score</th>
                    <th className="table-header">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectSummary.map(r => (
                    <tr key={r.subject} className="border-b border-gray-50">
                      <td className="table-cell pl-0 font-medium">{r.subject}</td>
                      <td className="table-cell font-semibold">{r.avg}%</td>
                      <td className="table-cell"><span className={`font-bold text-lg ${gradeColor(r.grade)}`}>{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed marks */}
      {(marks || []).length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">All Assessment Marks</h3>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Assessment</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Score</th>
                  <th className="table-header">Grade</th>
                </tr>
              </thead>
              <tbody>
                {(marks || []).map((m: any) => (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell font-medium text-gray-800">{m.title}</td>
                    <td className="table-cell text-gray-500">{m.subject_name}</td>
                    <td className="table-cell"><span className="badge bg-gray-100 text-gray-600 capitalize">{m.type}</span></td>
                    <td className="table-cell font-semibold">{m.marks_obtained}/{m.total_marks}</td>
                    <td className="table-cell"><span className={`font-bold ${gradeColor(m.grade)}`}>{m.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
