import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { Save, School, Bell, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SchoolSettings() {
  const { user } = useAuth()
  const schoolId = user?.schoolId

  const [form, setForm] = useState({ name: '', province: '', phone: '', email: '' })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })

  useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => api.get(`/schools/${schoolId}`).then(r => {
      const s = r.data.data
      setForm({ name: s.name || '', province: s.province || '', phone: s.phone || '', email: s.email || '' })
      return s
    }),
    enabled: !!schoolId,
  })

  const saveSchool = useMutation({
    mutationFn: () => api.put(`/schools/${schoolId}`, { name: form.name, province: form.province, phone: form.phone }),
    onSuccess: () => toast.success('School info saved!'),
    onError: () => toast.error('Failed to save school info'),
  })

  const changePassword = useMutation({
    mutationFn: () => api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password }),
    onSuccess: () => { toast.success('Password updated!'); setPwForm({ current_password: '', new_password: '', confirm: '' }) },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to update password'),
  })

  const handleChangePassword = () => {
    if (!pwForm.current_password || !pwForm.new_password) return toast.error('Fill in all password fields')
    if (pwForm.new_password !== pwForm.confirm) return toast.error('New passwords do not match')
    if (pwForm.new_password.length < 6) return toast.error('Password must be at least 6 characters')
    changePassword.mutate()
  }

  return (
    <div className="space-y-6 fade-in max-w-3xl">
      <div><h1 className="page-title">Settings</h1><p className="text-sm text-gray-500">Manage your school settings</p></div>

      {/* School Info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <School size={18} className="text-primary-600" />
          <h3 className="section-title">School Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">School Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">District / Province</label>
            <input className="input" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} /></div>
          <div><label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label className="label">Email</label>
            <input className="input" value={form.email} disabled className="input bg-gray-50 cursor-not-allowed" /></div>
        </div>
        <button onClick={() => saveSchool.mutate()} disabled={saveSchool.isPending} className="btn-primary">
          <Save size={15} /> {saveSchool.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Notifications — UI only, no backend */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-primary-600" />
          <h3 className="section-title">Notifications</h3>
        </div>
        {['Email notifications', 'SMS alerts', 'Exam reminders', 'Attendance alerts'].map(n => (
          <div key={n} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{n}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-primary-600 rounded-full transition-colors relative after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-5 after:transition-all"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={18} className="text-primary-600" />
          <h3 className="section-title">Change Password</h3>
        </div>
        <div><label className="label">Current Password</label>
          <input type="password" className="input" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} /></div>
        <div><label className="label">New Password</label>
          <input type="password" className="input" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} /></div>
        <div><label className="label">Confirm Password</label>
          <input type="password" className="input" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} /></div>
        <button onClick={handleChangePassword} disabled={changePassword.isPending} className="btn-primary">
          <Save size={15} /> {changePassword.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}
