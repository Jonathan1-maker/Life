import { FileText, Download, BarChart3, Users, School, CreditCard } from 'lucide-react'

const reports = [
  { title: 'School Performance Report', desc: 'Overview of all schools academic performance', icon: BarChart3, color: 'bg-blue-50 text-blue-600', generated: '2025-06-01', format: 'PDF' },
  { title: 'Student Enrollment Report', desc: 'Total enrollment stats across all districts', icon: Users, color: 'bg-green-50 text-green-600', generated: '2025-06-01', format: 'Excel' },
  { title: 'Schools Summary Report', desc: 'Summary of all registered schools and status', icon: School, color: 'bg-purple-50 text-purple-600', generated: '2025-05-31', format: 'PDF' },
  { title: 'Revenue & Billing Report', desc: 'Monthly subscription revenue breakdown', icon: CreditCard, color: 'bg-orange-50 text-orange-600', generated: '2025-06-01', format: 'Excel' },
  { title: 'Teacher Activity Report', desc: 'Teacher engagement and activity metrics', icon: Users, color: 'bg-teal-50 text-teal-600', generated: '2025-05-30', format: 'PDF' },
  { title: 'Platform Usage Report', desc: 'Daily/monthly active user statistics', icon: BarChart3, color: 'bg-pink-50 text-pink-600', generated: '2025-06-01', format: 'PDF' },
]

export default function SuperReports() {
  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-gray-500">Generate and download platform reports</p>
        </div>
        <button className="btn-primary"><FileText size={15} /> Generate Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
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
              <div>
                <p className="text-xs text-gray-400">Last generated</p>
                <p className="text-xs font-medium text-gray-600">{r.generated}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge bg-gray-100 text-gray-500 text-xs">{r.format}</span>
                <button className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick generate */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-indigo-50 border-primary-100">
        <h3 className="section-title mb-2">Custom Report</h3>
        <p className="text-sm text-gray-500 mb-4">Generate a custom report by selecting date range and metrics</p>
        <div className="flex flex-wrap gap-3">
          <input type="date" className="input w-40" defaultValue="2025-06-01" />
          <input type="date" className="input w-40" defaultValue="2025-06-30" />
          <select className="input w-44">
            <option>All Schools</option>
            <option>By District</option>
            <option>By Plan</option>
          </select>
          <button className="btn-primary">Generate</button>
        </div>
      </div>
    </div>
  )
}
