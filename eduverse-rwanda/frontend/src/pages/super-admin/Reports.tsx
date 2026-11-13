import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import { FileText, Download, BarChart3, Users, School, CreditCard, TrendingUp, Activity } from 'lucide-react'

const reportTemplates = [
  { title: 'School Performance Report', desc: 'Overview of all schools academic performance', icon: BarChart3, color: 'bg-blue-50 text-blue-600', format: 'PDF' },
  { title: 'Student Enrollment Report', desc: 'Total enrollment stats across all districts', icon: Users, color: 'bg-green-50 text-green-600', format: 'Excel' },
  { title: 'Schools Summary Report', desc: 'Summary of all registered schools and status', icon: School, color: 'bg-purple-50 text-purple-600', format: 'PDF' },
  { title: 'Revenue & Billing Report', desc: 'Monthly subscription revenue breakdown', icon: CreditCard, color: 'bg-orange-50 text-orange-600', format: 'Excel' },
  { title: 'Teacher Activity Report', desc: 'Teacher engagement and activity metrics', icon: Users, color: 'bg-teal-50 text-teal-600', format: 'PDF' },
  { title: 'Platform Usage Report', desc: 'Daily/monthly active user statistics', icon: BarChart3, color: 'bg-pink-50 text-pink-600', format: 'PDF' },
]

const metrics = [
  { value: 'all',         label: 'All Metrics' },
  { value: 'enrollments', label: 'Student Enrollments' },
  { value: 'schools',     label: 'School Registrations' },
  { value: 'activity',    label: 'Platform Activity' },
  { value: 'performance', label: 'Academic Performance' },
]

export default function SuperReports() {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [metric, setMetric] = useState('all')
  const [result, setResult] = useState<any>(null)

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => api.post('/analytics/custom-report', { startDate, endDate, metric }).then(r => r.data.data),
    onSuccess: data => setResult(data),
  })

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-gray-500">Generate and download platform reports</p>
        </div>
      </div>

      {/* Report templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((r) => (
          <div key={r.title} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${r.color}`}>
                <r.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="badge bg-gray-100 text-gray-500 text-xs">{r.format}</span>
              <button className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Report */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
        <h3 className="section-title mb-1">Custom Report</h3>
        <p className="text-sm text-gray-500 mb-5">Generate a custom report by selecting date range and metrics</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">From</label>
            <input type="date" className="input w-40" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input w-40" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Metric</label>
            <select className="input w-52" value={metric} onChange={e => setMetric(e.target.value)}>
              {metrics.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <button onClick={() => generate()} disabled={isPending} className="btn-primary disabled:opacity-60">
            {isPending ? 'Generating...' : 'Generate'}
          </button>
          {result && (
            <button onClick={() => setResult(null)} className="btn-secondary text-xs">Clear</button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Users size={18} className="text-green-600" /></div>
              <p className="text-2xl font-bold text-gray-800">{result.summary?.newStudents ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">New Students</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2"><School size={18} className="text-blue-600" /></div>
              <p className="text-2xl font-bold text-gray-800">{result.summary?.newSchools ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">New Schools</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2"><Activity size={18} className="text-purple-600" /></div>
              <p className="text-2xl font-bold text-gray-800">{result.summary?.totalActions ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">Total Actions</p>
            </div>
          </div>

          {/* Enrollments table */}
          {result.enrollments?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Student Enrollments by Month</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="table-header">Month</th><th className="table-header">New Students</th></tr></thead>
                <tbody>
                  {result.enrollments.map((r: any) => (
                    <tr key={r.month} className="table-row">
                      <td className="table-cell">{r.month}</td>
                      <td className="table-cell font-semibold text-green-600">{r.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Schools table */}
          {result.schools?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <School size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-sm">School Registrations by Month</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="table-header">Month</th><th className="table-header">New Schools</th></tr></thead>
                <tbody>
                  {result.schools.map((r: any) => (
                    <tr key={r.month} className="table-row">
                      <td className="table-cell">{r.month}</td>
                      <td className="table-cell font-semibold text-blue-600">{r.schools}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Activity table */}
          {result.activity?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Activity size={16} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Platform Activity by Day</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="table-header">Date</th><th className="table-header">Actions</th></tr></thead>
                <tbody>
                  {result.activity.map((r: any) => (
                    <tr key={r.day} className="table-row">
                      <td className="table-cell font-mono text-xs">{r.day}</td>
                      <td className="table-cell font-semibold text-purple-600">{r.actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Performance table */}
          {result.performance?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 size={16} className="text-orange-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Academic Performance by School</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50"><tr><th className="table-header">School</th><th className="table-header">Avg Score</th><th className="table-header">Report Cards</th></tr></thead>
                <tbody>
                  {result.performance.map((r: any) => (
                    <tr key={r.school} className="table-row">
                      <td className="table-cell font-medium">{r.school}</td>
                      <td className="table-cell">
                        <span className={`font-bold ${r.avg_score >= 70 ? 'text-green-600' : r.avg_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{r.avg_score}%</span>
                      </td>
                      <td className="table-cell text-gray-500">{r.report_cards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.summary?.newStudents === 0 && result.summary?.newSchools === 0 && result.summary?.totalActions === 0 && (
            <div className="card p-8 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No data found for the selected date range</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
