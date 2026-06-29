import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { School, Users, GraduationCap, Activity, Plus, TrendingUp, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#2563eb', '#e2e8f0']
const PLAN_COLORS: Record<string, string> = {
  basic: '#60a5fa', standard: '#34d399', premium: '#a78bfa', enterprise: '#f472b6',
}

export default function SuperDashboard() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['super-dashboard'],
    queryFn: () => api.get('/analytics/platform').then(r => r.data.data),
    retry: false,
  })

  const schools      = data?.schools
  const students     = data?.students
  const teachers     = data?.teachers
  const activeUsers  = data?.active_users ?? 0
  const revenue      = data?.revenue
  const planData     = (data?.schools_by_plan ?? []).map((p: any) => ({
    plan: p.plan ?? 'unknown',
    count: parseInt(p.count),
    fill: PLAN_COLORS[p.plan] ?? '#94a3b8',
  }))
  const topSchools   = data?.top_schools ?? []
  const activities   = data?.recent_activities ?? []
  const perfTrend    = data?.performance_trend ?? []
  const unreadMsgs   = data?.unread_messages ?? 0

  const totalRevenue = parseFloat(revenue?.total ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const revenueDonut = revenue?.total > 0
    ? [{ name: 'Revenue', value: 70 }, { name: 'Remaining', value: 30 }]
    : [{ name: 'No data', value: 1 }]

  const stats = [
    { label: 'Total Schools',   value: schools?.total ?? 0,   sub: `+${schools?.this_month ?? 0} this month`,   icon: School,       color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Students',  value: students?.total ?? 0,  sub: `+${students?.this_month ?? 0} this month`,  icon: GraduationCap, color: 'bg-green-50 text-green-600' },
    { label: 'Teachers',        value: teachers?.total ?? 0,  sub: `+${teachers?.this_month ?? 0} this month`,  icon: Users,         color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Users',    value: activeUsers,           sub: 'last 30 days',                              icon: Activity,      color: 'bg-orange-50 text-orange-600' },
  ]

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back, Super Admin! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening across all schools today.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{format(new Date(), 'MMM dd, yyyy')}</span>
          <button onClick={() => navigate('/super-admin/schools')} className="btn-primary">
            <Plus size={15} /> Add School
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{Number(value).toLocaleString()}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                <TrendingUp size={11} /> {sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Performance trend from DB */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="section-title mb-4">Student Performance Overview</h3>
          {perfTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={perfTrend}>
                <defs>
                  <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="avg" stroke="#2563eb" fill="url(#currGrad)" strokeWidth={2} dot={{ r: 4 }} name="Avg Score" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300">
              <TrendingUp size={40} className="mb-2 opacity-40" />
              <p className="text-sm">No performance data yet</p>
              <p className="text-xs">Data will appear once assessments are entered</p>
            </div>
          )}
        </div>

        {/* Top Schools from DB */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Top Performing Schools</h3>
          {topSchools.length > 0 ? (
            <div className="space-y-3">
              {topSchools.map((s: any, i: number) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm text-gray-700 truncate max-w-[140px]">{s.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{s.avg_performance ?? 0}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full ml-6">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${s.avg_performance ?? 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-300">
              <School size={36} className="mb-2 opacity-40" />
              <p className="text-sm">No schools yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue donut */}
        <div className="card p-5">
          <h3 className="section-title mb-1">Subscriptions</h3>
          <div className="flex items-center gap-4 mt-3">
            <PieChart width={100} height={100}>
              <Pie data={revenueDonut} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" startAngle={90} endAngle={-270}>
                {revenueDonut.map((_, i) => <Cell key={i} fill={revenue?.total > 0 ? COLORS[i] : '#e2e8f0'} />)}
              </Pie>
            </PieChart>
            <div>
              <p className="text-xs text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{totalRevenue}</p>
              <p className="text-xs text-gray-400 mt-0.5">+{revenue?.this_month ?? 0} this month</p>
            </div>
          </div>
        </div>

        {/* Schools by plan from DB */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Schools by Plan</h3>
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={planData} barSize={20}>
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {planData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-300 text-sm">No plan data yet</div>
          )}
        </div>

        {/* Recent activities from DB */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Activities</h3>
            <button onClick={() => navigate('/super-admin/audit-logs')} className="text-xs text-primary-600 font-medium hover:underline">View all</button>
          </div>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-600">
                    {(a.action ?? 'A')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize">{a.action?.toLowerCase().replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400 truncate">{a.user_name ?? a.school_name ?? '—'}</p>
                  </div>
                  <span className="text-xs text-gray-300 whitespace-nowrap">
                    {a.created_at ? format(new Date(a.created_at), 'HH:mm') : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-300">
              <Activity size={28} className="mb-1 opacity-40" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Unread messages */}
      <div className="card p-5 flex items-center justify-between bg-blue-50 border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MessageSquare size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{unreadMsgs} Unread message{unreadMsgs !== 1 ? 's' : ''}</p>
            <p className="text-xs text-gray-500">
              {unreadMsgs > 0 ? 'You have messages waiting for your response' : 'You are all caught up!'}
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/super-admin/messages')} className="btn-primary">View Messages</button>
      </div>
    </div>
  )
}
