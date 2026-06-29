import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { BookOpen, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setAuth(data.data.user, data.data.token)
      toast.success(`Welcome back, ${data.data.user.name}!`)
      const roleMap: Record<string, string> = {
        super_admin: '/super-admin/dashboard',
        school_admin: '/school-admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard',
      }
      navigate(roleMap[data.data.user.role] || '/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 blue-gradient text-white">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-xl">EduVerse</p>
            <p className="text-blue-200 text-xs">RWANDA</p>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 leading-tight">Smart School<br />Management Platform</h1>
        <p className="text-blue-100 text-lg mb-10">Connecting schools, teachers, students and parents in one powerful platform.</p>
        <div className="space-y-3">
          {['124+ Schools Registered', '18,542+ Students Enrolled', 'AI-Powered Learning Tools', 'Real-time Analytics'].map(f => (
            <div key={f} className="flex items-center gap-3 text-blue-100">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs">✓</span>
              </div>
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="font-bold text-primary-600">EduVerse Rwanda</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to access your dashboard</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@school.rw"
                  required
                  autoFocus
                  className="input"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base mt-2">
                {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" /> : <LogIn size={17} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Don't have an account?{' '}
              <span className="text-primary-600 font-medium">Contact your school admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
