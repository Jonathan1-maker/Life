import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { GraduationCap, TrendingUp, MessageSquare, Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ParentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: children } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: () => api.get(`/parents/${user?.id}/children`).then(r => r.data.data || []),
    enabled: !!user?.id,
    retry: false,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data || []),
    retry: false,
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data.data || []),
    retry: false,
  })

  const unreadNotifs = (notifications || []).filter((n: any) => !n.is_read)

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-gray-500">Monitor your children's progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Children', val: (children || []).length, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: 'Notifications', val: unreadNotifs.length, icon: Bell, color: 'text-orange-600 bg-orange-50' },
          { label: 'Announcements', val: (announcements || []).length, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Messages', val: 0, icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* Children cards from DB */}
      {(children || []).length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {(children || []).map((c: any) => (
            <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-gray-400">{c.class_name || '—'} · {c.relationship}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Admission No.</p>
                  <p className="text-sm font-bold text-blue-600">{c.admission_number || '—'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-bold text-green-600 capitalize">{c.status || 'active'}</p>
                </div>
              </div>
              <button onClick={() => navigate('/parent/children')} className="btn-primary w-full justify-center mt-3 text-xs py-1.5">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Notifications from DB */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Notifications</h3>
            <Bell size={16} className="text-gray-400" />
          </div>
          {(notifications || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
          ) : (
            <div className="space-y-3">
              {(notifications || []).slice(0, 5).map((n: any) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${n.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements from DB */}
        <div className="card p-5">
          <h3 className="section-title mb-4">School Announcements</h3>
          {(announcements || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No announcements</p>
          ) : (
            <div className="space-y-3">
              {(announcements || []).slice(0, 4).map((a: any) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-l-primary-400">
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
