import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { TrendingUp, Calendar, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

export default function ParentChildren() {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: children, isLoading } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: () => api.get(`/parents/${user?.id}/children`).then(r => r.data.data || []),
    enabled: !!user?.id,
    retry: false,
  })

  const { data: marksMap } = useQuery({
    queryKey: ['children-marks', expanded],
    queryFn: () => api.get(`/marks/student/${expanded}`).then(r => r.data.data || []),
    enabled: !!expanded,
    retry: false,
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['children-attendance', expanded],
    queryFn: () => {
      const now = new Date()
      return api.get(`/attendance/student/${expanded}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(r => r.data.data)
    },
    enabled: !!expanded,
    retry: false,
  })

  const bySubject: Record<string, number[]> = {}
  ;(marksMap || []).forEach((m: any) => {
    if (!bySubject[m.subject_name]) bySubject[m.subject_name] = []
    bySubject[m.subject_name].push(parseFloat(m.marks_obtained || 0))
  })

  const subjectAvgs = Object.entries(bySubject).map(([name, scores]) => ({
    name,
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }))

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">My Children</h1>
        <p className="text-sm text-gray-500">Track your children's academic performance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : (children || []).length === 0 ? (
        <div className="card flex items-center justify-center h-40">
          <p className="text-sm text-gray-400">No children linked to your account yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(children || []).map((c: any) => {
            const isOpen = expanded === c.id
            const summary = attendanceData?.summary
            return (
              <div key={c.id} className="card overflow-hidden">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                      {c.first_name?.[0]}{c.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-base">{c.first_name} {c.last_name}</p>
                      <p className="text-xs text-gray-400">{c.class_name || '—'} · {c.relationship} · #{c.admission_number || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${c.status === 'active' || !c.status ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {c.status || 'active'}
                    </span>
                    {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5 grid md:grid-cols-3 gap-5">
                    {/* Subject scores */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <BookOpen size={14} className="text-primary-600" /> Subject Scores
                      </h4>
                      {subjectAvgs.length === 0 ? (
                        <p className="text-xs text-gray-400">No marks recorded yet</p>
                      ) : (
                        <div className="space-y-2">
                          {subjectAvgs.map(s => (
                            <div key={s.name}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">{s.name}</span>
                                <span className={`text-xs font-bold ${s.avg >= 80 ? 'text-green-600' : s.avg >= 60 ? 'text-blue-600' : 'text-red-600'}`}>{s.avg}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full">
                                <div className={`h-full rounded-full ${s.avg >= 80 ? 'bg-green-500' : s.avg >= 60 ? 'bg-blue-500' : 'bg-red-400'}`} style={{ width: `${s.avg}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Attendance */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={14} className="text-primary-600" /> Attendance (This Month)
                      </h4>
                      {!summary ? (
                        <p className="text-xs text-gray-400">No attendance data</p>
                      ) : (
                        <div className="space-y-3">
                          {[
                            { label: 'Present', val: `${summary.percent}%`, color: 'bg-green-500', text: 'text-green-600' },
                            { label: 'Absent', val: `${summary.absent} days`, color: 'bg-red-500', text: 'text-red-600' },
                            { label: 'Total Days', val: summary.total, color: 'bg-blue-500', text: 'text-blue-600' },
                          ].map(a => (
                            <div key={a.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${a.color}`} />
                                <span className="text-sm text-gray-600">{a.label}</span>
                              </div>
                              <span className={`text-sm font-semibold ${a.text}`}>{a.val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent marks */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary-600" /> Recent Marks
                      </h4>
                      {(marksMap || []).length === 0 ? (
                        <p className="text-xs text-gray-400">No marks recorded yet</p>
                      ) : (
                        <div className="space-y-2">
                          {(marksMap || []).slice(0, 4).map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs font-medium text-gray-700">{m.title}</p>
                                <p className="text-xs text-gray-400">{m.subject_name}</p>
                              </div>
                              <span className={`text-sm font-bold ${m.grade === 'A' ? 'text-green-600' : m.grade === 'B' ? 'text-blue-600' : 'text-orange-600'}`}>
                                {m.marks_obtained}/{m.total_marks}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
