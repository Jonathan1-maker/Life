import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, BookOpen, GraduationCap, TrendingUp, Plus, X, Loader2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function SchoolDashboard() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal' })
  const [showConduct, setShowConduct] = useState(false)
  const [conductClass, setConductClass] = useState('')
  const [conductTerm, setConductTerm] = useState('')
  const [conductEntries, setConductEntries] = useState<Record<string, { marks: string; comment: string }>>({})

  const { data: analytics } = useQuery({
    queryKey: ['school-analytics'],
    queryFn: () => api.get('/analytics/school').then(r => r.data.data),
    retry: false,
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data.data || []),
    retry: false,
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit-logs').then(r => r.data.data || []),
    retry: false,
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
    retry: false,
  })

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data.data || []),
    retry: false,
  })

  const { data: conductStudents } = useQuery({
    queryKey: ['conduct-students', conductClass],
    queryFn: () => api.get(`/report-cards/students?class_id=${conductClass}`).then(r => r.data.data || []),
    enabled: !!conductClass,
  })

  const saveConductMutation = useMutation({
    mutationFn: (entries: any[]) => api.post('/conduct', { entries }),
    onSuccess: () => {
      toast.success('Conduct marks saved!')
      setShowConduct(false)
      setConductEntries({})
    },
    onError: () => toast.error('Failed to save conduct marks'),
  })

  const handleSaveConduct = () => {
    if (!conductTerm) return toast.error('Select a term')
    const entries = (conductStudents || []).map((s: any) => ({
      student_id: s.id,
      term_id: conductTerm,
      marks: parseInt(conductEntries[s.id]?.marks || '0'),
      comment: conductEntries[s.id]?.comment || '',
    })).filter((e: any) => e.marks > 0)
    if (!entries.length) return toast.error('Enter at least one conduct mark')
    saveConductMutation.mutate(entries)
  }

  const createAnn = useMutation({
    mutationFn: (payload: any) => api.post('/announcements', payload),
    onSuccess: () => {
      toast.success('Announcement posted!')
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowAnnouncement(false)
      setAnnForm({ title: '', content: '', priority: 'normal' })
    },
    onError: () => toast.error('Failed to post announcement'),
  })

  const deleteAnn = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })

  const trend = analytics?.performance_trend || []
  const attendanceTrend = trend.map((t: any) => ({
    week: new Date(t.week).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    avg: parseFloat(t.avg) || 0,
  }))

  const priorityColor: Record<string, string> = {
    urgent: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    normal: 'border-l-blue-500 bg-blue-50',
    low: 'border-l-gray-400 bg-gray-50',
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('schoolAdmin.welcome')}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-gray-500">{t('schoolAdmin.schoolDashboard')}</p>
        </div>
        <button onClick={() => setShowAnnouncement(true)} className="btn-primary">
          <Plus size={15} /> {t('schoolAdmin.addAnnouncement')}
        </button>
      </div>

      {/* Stats from DB */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
              { label: t('schoolAdmin.students'), val: analytics?.students ?? '—', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: t('schoolAdmin.teachers'), val: analytics?.teachers ?? '—', icon: Users, color: 'text-green-600 bg-green-50' },
          { label: t('schoolAdmin.classesCount'), val: analytics?.classes ?? '—', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
          { label: t('schoolAdmin.avgPerformance'), val: analytics?.avg_performance ? `${analytics.avg_performance}%` : '—', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
            <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.val}</p></div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Performance trend */}
        <div className="card p-5">
          <h3 className="section-title mb-4">{t('schoolAdmin.performanceTrend')}</h3>
          {attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attendanceTrend} barSize={24}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Score']} />
                <Bar dataKey="avg" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">{t('schoolAdmin.noPerformanceData')}</div>
          )}
        </div>

        {/* Recent activity from audit logs */}
        <div className="card p-5">
          <h3 className="section-title mb-4">{t('schoolAdmin.recentActivity')}</h3>
          {(auditLogs || []).length === 0 ? (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">{t('schoolAdmin.noActivity')}</div>
          ) : (
            <div className="space-y-3">
              {(auditLogs || []).slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-primary-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 capitalize">{a.action?.toLowerCase().replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{a.user_name} · {new Date(a.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conduct Marks */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-teal-600" />
            <h3 className="section-title">{t('schoolAdmin.conductMarks')}</h3>
          </div>
          <button onClick={() => setShowConduct(true)} className="btn-primary">
            <Plus size={14} /> {t('schoolAdmin.enterConductMarks')}
          </button>
        </div>
        <p className="text-sm text-gray-400">{t('schoolAdmin.conductDesc')}</p>
      </div>

      {/* Announcements from DB */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">{t('schoolAdmin.announcements')}</h3>
          <span className="badge bg-gray-100 text-gray-500">{(announcements || []).length}</span>
        </div>
        {(announcements || []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('schoolAdmin.noAnnouncements')}</p>
        ) : (
          <div className="space-y-3">
            {(announcements || []).slice(0, 5).map((a: any) => (
              <div key={a.id} className={`p-3 rounded-lg border-l-4 ${priorityColor[a.priority] || priorityColor.normal} flex items-start justify-between`}>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.created_by_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteAnn.mutate(a.id)} className="ml-3 p-1 hover:bg-white/60 rounded text-gray-400 hover:text-red-500 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conduct modal */}
      {showConduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t('schoolAdmin.enterConductMarks')}</h2>
              <button onClick={() => setShowConduct(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('common.search').replace('Search','Class') || 'Class'}</label>
                  <select className="input" value={conductClass} onChange={e => { setConductClass(e.target.value); setConductEntries({}) }}>
                    <option value="">{t('schoolAdmin.selectClass')}</option>
                    {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('terms.title')}</label>
                  <select className="input" value={conductTerm} onChange={e => setConductTerm(e.target.value)}>
                    <option value="">{t('schoolAdmin.selectTerm')}</option>
                    {(terms || []).map((t: any) => <option key={t.id} value={t.id}>{t.year_name} — Term {t.name}</option>)}
                  </select>
                </div>
              </div>
              {conductClass && conductTerm && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">{t('common.name')}</th>
                      <th className="text-center py-2 text-gray-500 font-medium">{t('schoolAdmin.marksOutOf')}</th>
                      <th className="text-left py-2 text-gray-500 font-medium">{t('schoolAdmin.comment')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(conductStudents || []).map((s: any) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="py-1.5 text-gray-800">{s.first_name} {s.last_name}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number" min={0} max={40}
                            className="input text-center w-20"
                            value={conductEntries[s.id]?.marks || ''}
                            onChange={e => setConductEntries(prev => ({ ...prev, [s.id]: { ...prev[s.id], marks: e.target.value } }))}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1.5">
                          <input
                            className="input"
                            value={conductEntries[s.id]?.comment || ''}
                            onChange={e => setConductEntries(prev => ({ ...prev, [s.id]: { ...prev[s.id], comment: e.target.value } }))}
                          placeholder={t('schoolAdmin.optionalComment')}
                          />
                        </td>
                      </tr>
                    ))}
                    {(conductStudents || []).length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-sm">Select a class to see students</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-between px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowConduct(false)} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleSaveConduct} disabled={saveConductMutation.isPending} className="btn-primary px-6">
                {saveConductMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> {t('common.saving')}</> : t('schoolAdmin.saveConductMarks')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement modal */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t('schoolAdmin.newAnnouncement')}</h2>
              <button onClick={() => setShowAnnouncement(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">{t('schoolAdmin.announcementTitle')} *</label>
                <input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Announcement title" />
              </div>
              <div>
                <label className="label">{t('schoolAdmin.announcementContent')} *</label>
                <textarea value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} className="input h-24 resize-none" placeholder="Write the announcement..." />
              </div>
              <div>
                <label className="label">{t('schoolAdmin.priority')}</label>
                <select value={annForm.priority} onChange={e => setAnnForm(f => ({ ...f, priority: e.target.value }))} className="input">
                  <option value="low">{t('schoolAdmin.low')}</option>
                  <option value="normal">{t('schoolAdmin.normal')}</option>
                  <option value="high">{t('schoolAdmin.high')}</option>
                  <option value="urgent">{t('schoolAdmin.urgent')}</option>
                </select>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button onClick={() => setShowAnnouncement(false)} className="btn-secondary">{t('common.cancel')}</button>
                <button
                  onClick={() => { if (!annForm.title || !annForm.content) return toast.error('Fill in title and content'); createAnn.mutate({ ...annForm, target_roles: [] }) }}
                  disabled={createAnn.isPending}
                  className="btn-primary px-6"
                >
                  {createAnn.isPending ? <><Loader2 size={15} className="animate-spin" /> {t('common.posting')}</> : t('schoolAdmin.postAnnouncement')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
