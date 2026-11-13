import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { Save, School, Bell, Lock, ShieldOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function SchoolSettings() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const qc = useQueryClient()
  const schoolId = user?.schoolId

  const [form, setForm] = useState({ name: '', province: '', phone: '', email: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })

  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => api.get(`/schools/${schoolId}`).then(r => {
      const s = r.data.data
      setForm({ name: s.name || '', province: s.province || '', phone: s.phone || '', email: s.email || '' })
      return s
    }),
    enabled: !!schoolId,
    staleTime: 0,
  })

  const marksLocked = school?.settings?.marks_locked === true

  const toggleMarksLock = useMutation({
    mutationFn: (locked: boolean) => api.post('/schools/my/marks-lock', { locked }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school', schoolId] })
    },
    onError: () => toast.error('Failed to update lock'),
  })

  const saveSchool = useMutation({
    mutationFn: () => api.put(`/schools/${schoolId}`, { name: form.name, province: form.province, phone: form.phone }),
    onSuccess: () => toast.success(t('settings.saveChanges') + '!'),
    onError: () => toast.error(t('common.noData')),
  })

  const changePassword = useMutation({
    mutationFn: () => api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password }),
    onSuccess: () => { toast.success(t('settings.updatePassword') + '!'); setPwForm({ current_password: '', new_password: '', confirm: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.error || t('common.noData')),
  })

  const handleChangePassword = () => {
    if (!pwForm.current_password || !pwForm.new_password) return toast.error(t('common.noData'))
    if (pwForm.new_password !== pwForm.confirm) return toast.error(t('common.noData'))
    if (pwForm.new_password.length < 6) return toast.error(t('common.noData'))
    changePassword.mutate()
  }

  const notificationItems = [
    t('settings.emailNotifications'),
    t('settings.smsAlerts'),
    t('settings.examReminders'),
    t('settings.attendanceAlerts'),
  ]

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div><h1 className="page-title">{t('settings.title')}</h1><p className="text-sm text-gray-500">{t('settings.subtitle')}</p></div>

      {/* School Info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <School size={18} className="text-primary-600" />
          <h3 className="section-title">{t('settings.schoolInfo')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">{t('settings.schoolName')}</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">{t('settings.districtProvince')}</label>
            <input className="input" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} /></div>
          <div><label className="label">{t('common.phone')}</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label className="label">{t('common.email')}</label>
            <input className="input bg-gray-50 cursor-not-allowed" value={form.email} disabled /></div>
        </div>
        <button onClick={() => saveSchool.mutate()} disabled={saveSchool.isPending} className="btn-primary">
          <Save size={15} /> {saveSchool.isPending ? t('settings.saving') : t('settings.saveChanges')}
        </button>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-primary-600" />
          <h3 className="section-title">{t('settings.notifications')}</h3>
        </div>
        {notificationItems.map(n => (
          <div key={n} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{n}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-primary-600 rounded-full transition-colors relative after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-5 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Marks Lock */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldOff size={18} className="text-primary-600" />
          <h3 className="section-title">Marks Entry Control</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Lock Marks Entry</p>
            <p className="text-xs text-gray-500 mt-0.5">When locked, teachers cannot add or update marks</p>
          </div>
          <button
            onClick={() => {
              const next = !marksLocked
              toggleMarksLock.mutate(next)
              toast.success(next ? 'Marks entry locked' : 'Marks entry unlocked')
            }}
            disabled={toggleMarksLock.isPending}
            className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors ${
              marksLocked ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${
              marksLocked ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        <p className={`mt-3 text-xs font-medium ${ marksLocked ? 'text-red-600' : 'text-green-600' }`}>
          {marksLocked ? '🔒 Marks entry is currently LOCKED' : '🔓 Marks entry is currently OPEN'}
        </p>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} className="text-primary-600" />
          <h3 className="section-title">{t('settings.changePassword')}</h3>
        </div>
        <div><label className="label">{t('settings.currentPassword')}</label>
          <input type="password" className="input" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} /></div>
        <div><label className="label">{t('settings.newPassword')}</label>
          <input type="password" className="input" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} /></div>
        <div><label className="label">{t('settings.confirmPassword')}</label>
          <input type="password" className="input" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
        <button onClick={handleChangePassword} disabled={changePassword.isPending} className="btn-primary">
          <Save size={15} /> {changePassword.isPending ? t('settings.updating') : t('settings.updatePassword')}
        </button>
      </div>
    </div>
  )
}
