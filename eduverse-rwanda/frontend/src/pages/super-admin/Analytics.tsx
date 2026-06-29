import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, School, Users, GraduationCap } from 'lucide-react'

const GENDER_COLORS = ['#2563eb', '#ec4899']

export default function SuperAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['super-analytics'],
    queryFn: () => api.get('/analytics/platform').then(r => r.data.data),
    retry: false,
  })

  const enrollmentTrend  = data?.enrollment_trend ?? []
  const districtData     = data?.schools_by_district ?? []
  const perfByLevel      = data?.performance_by_level ?? []
  const genderData       = data?.gender_distribution ?? []
  const schools          = data?.schools
  const students         = data?.students
  const teachers         = data?.teachers

  const statsCards = [
    { label: 'Avg Attendance',  val: data?.avg_attendance  ? `${data.avg_attendance}%`  : '0%',  trend: '', icon: TrendingUp,   color: 'text-green-600 bg-green-50' },
    { label: 'Avg Performance', val: data?.avg_performance ? `${data.avg_performance}%` : '0%',  trend: '', icon: TrendingUp,   color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Schools',   val: schools?.total ?? 0,    trend: `+${schools?.this_month ?? 0} this month`,  icon: School,       color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Students',  val: students?.total ?? 0,   trend: `+${students?.this_month ?? 0} this month`, icon: GraduationCap, color: 'text-orange-600 bg-orange-50' },
  ]

  const EmptyState = ({ label }: { label: string }) => (
    <div className="h-44 flex flex-col items-center justify-center text-gray-300">
      <TrendingUp size={36} className="mb-2 opacity-30" />
      <p className="text-sm">{label}</p>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-gray-500">Platform-wide insights and performance metrics</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</p>
              {s.trend && <p className="text-xs text-green-600">{s.trend}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Enrollment trend */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Student Enrollment Trend</h3>
          {enrollmentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={enrollmentTrend}>
                <defs>
                  <linearGradient id="enroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="students" stroke="#2563eb" fill="url(#enroll)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No enrollment data yet" />}
        </div>

        {/* Schools by district */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Schools by District</h3>
          {districtData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={districtData} barSize={28}>
                <XAxis dataKey="district" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="schools" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No district data yet" />}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Performance by level */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Performance by Level</h3>
          {perfByLevel.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={perfByLevel} barSize={32}>
                <XAxis dataKey="level" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Score']} />
                <Bar dataKey="avg" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No performance data yet" />}
        </div>

        {/* Gender distribution */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Gender Distribution</h3>
          {genderData.length > 0 ? (
            <div className="flex items-center justify-center gap-8">
              <PieChart width={160} height={160}>
                <Pie data={genderData} cx={75} cy={75} outerRadius={65} dataKey="value" labelLine={false}>
                  {genderData.map((_: any, i: number) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-3">
                {genderData.map((d: any, i: number) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: GENDER_COLORS[i] }}></div>
                    <span className="text-sm text-gray-600">{d.name}: <strong>{d.value}%</strong></span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState label="No gender data yet" />}
        </div>
      </div>
    </div>
  )
}
