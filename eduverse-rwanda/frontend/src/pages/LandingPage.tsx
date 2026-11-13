import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight, Play, School, BarChart3, Brain, Users, BookOpen, MessageCircle,
  ChevronRight, CheckCircle, Phone, Mail, MapPin, Shield, Zap,
  TrendingUp, Award
} from 'lucide-react'

const features = [
  { icon: School, label: 'Multi-School\nManagement', color: 'text-blue-600 bg-blue-50' },
  { icon: BarChart3, label: 'Smart\nAnalytics', color: 'text-green-600 bg-green-50' },
  { icon: Brain, label: 'AI Study\nAssistant', color: 'text-purple-600 bg-purple-50' },
  { icon: Users, label: 'Parent\nPortal', color: 'text-orange-600 bg-orange-50' },
  { icon: BookOpen, label: 'Digital\nPortfolio', color: 'text-teal-600 bg-teal-50' },
  { icon: MessageCircle, label: 'Communication\nCenter', color: 'text-pink-600 bg-pink-50' },
]

const roles = [
  { title: 'Super Admin', sub: 'Full Control', color: 'from-blue-500 to-indigo-600', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face' },
  { title: 'School Admin', sub: 'Manage School', color: 'from-green-500 to-teal-600', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
  { title: 'Teacher', sub: 'Empower Students', color: 'from-purple-500 to-violet-600', img: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=300&h=300&fit=crop&crop=face' },
  { title: 'Student', sub: 'Learn & Grow', color: 'from-pink-500 to-rose-600', img: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=300&h=300&fit=crop&crop=face' },
  { title: 'Parent', sub: 'Stay Connected', color: 'from-orange-500 to-amber-600', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&crop=face' },
]

const featureCards = [
  {
    icon: School, title: 'Multi-School Management', color: 'bg-blue-50 text-blue-600',
    desc: 'Manage hundreds of schools from one powerful dashboard. Track performance, users, and subscriptions in real time.',
    items: ['Centralized school registry', 'Per-school dashboards', 'District-level reports'],
  },
  {
    icon: BarChart3, title: 'Smart Analytics', color: 'bg-green-50 text-green-600',
    desc: 'Deep insights into student performance, attendance trends, and school-wide academic progress.',
    items: ['Real-time performance charts', 'Attendance heatmaps', 'Exportable reports'],
  },
  {
    icon: Brain, title: 'AI Study Assistant', color: 'bg-purple-50 text-purple-600',
    desc: 'Personalized AI-powered learning paths and study suggestions tailored to each student.',
    items: ['Smart study plans', 'Exam preparation tips', 'Weakness detection'],
  },
  {
    icon: MessageCircle, title: 'Communication Center', color: 'bg-pink-50 text-pink-600',
    desc: 'Seamless messaging between teachers, students, parents and school administration.',
    items: ['In-app messaging', 'Announcement broadcasts', 'Parent-teacher chat'],
  },
  {
    icon: BookOpen, title: 'Digital Portfolio', color: 'bg-teal-50 text-teal-600',
    desc: 'Students build a digital portfolio of their academic work, achievements, and certificates.',
    items: ['Assignment submissions', 'Achievement badges', 'Certificate generation'],
  },
  {
    icon: Shield, title: 'Secure & Reliable', color: 'bg-orange-50 text-orange-600',
    desc: 'Enterprise-grade security with role-based access control and full audit trail logging.',
    items: ['Role-based access', 'Audit logs', 'Data encryption'],
  },
]





export default function LandingPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', schoolName: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true); setSendError('')
    try {
      await api.post('/contact', form)
      setSent(true)
      setForm({ firstName: '', lastName: '', email: '', schoolName: '', message: '' })
    } catch {
      setSendError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const { data: dbStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/analytics/public-stats').then(r => r.data.data),
    retry: false,
  })

  const stats = [
    { val: dbStats?.totalSchools ?? 0, label: t('landing.schoolsRegistered'), icon: School },
    { val: dbStats?.totalStudents ?? 0, label: t('landing.studentsEnrolled'), icon: Users },
    { val: dbStats?.totalTeachers ?? 0, label: t('landing.teachersActive'), icon: Award },
    { val: dbStats?.uptime ?? 0, label: t('landing.uptimeGuaranteed'), icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-primary-600 text-lg">EduVerse</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary-600 transition-colors">{t('landing.features')}</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">{t('landing.contact')}</a>
          </div>
          <Link to="/login" className="btn-primary">
            {t('landing.signIn')} <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-gradient pt-20 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <div className="fade-in">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
              <BookOpen size={13} />
              All-in-One Education Platform
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              {t('landing.heroTitle').split('\n').map((line: string, i: number) => (
                <span key={i}>{i === 1 ? <span className="text-primary-600">{line}</span> : line}{i < 2 && <br />}</span>
              ))}
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/login" className="btn-primary px-6 py-3 text-base">
                {t('landing.getStartedFree')} <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-secondary px-6 py-3 text-base gap-2">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                  <Play size={12} className="text-white ml-0.5" />
                </div>
                {t('landing.seeFeatures')}
              </a>
            </div>

            {/* Feature icons row */}
            <div className="mt-12">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">{t('landing.powerfulFeatures')}</p>
              <div className="flex flex-wrap gap-4">
                {features.map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-xs text-gray-500 text-center whitespace-pre-line leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — real photo */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Decorative blobs */}
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-indigo-200 rounded-full opacity-30 blur-3xl"></div>

              {/* Main image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=700&h=500&fit=crop"
                  alt="Students learning with technology"
                  className="w-full h-80 object-cover"
                />

              </div>


            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-primary-600 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ val, label, icon: Icon }) => (
            <div key={label} className="text-center text-white">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-3xl font-extrabold">{typeof val === 'number' ? val.toLocaleString() : val}</p>
              <p className="text-blue-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-primary-100">
              <Zap size={13} /> {t('landing.everythingYouNeed')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{t('landing.featuresTitle')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">{f.desc}</p>
                <ul className="space-y-1.5">
                  {f.items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONE PLATFORM MANY ROLES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{t('landing.onePlatform')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.onePlatformSub')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roles.map((role) => (
              <div key={role.title} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className={`h-32 bg-gradient-to-br ${role.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 bg-white/10"></div>
                  <img src={role.img} alt={role.title} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-4 text-center bg-white">
                  <p className="font-bold text-gray-800 text-sm">{role.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{role.sub}</p>
                  <Link to="/login" className="mt-3 inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:underline">
                    {t('landing.access')} <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{t('landing.howItWorks')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">{t('landing.howItWorksSub')}</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: School, title: 'Register Your School', desc: 'Sign up and add your school details to get started on the platform.', color: 'bg-blue-50 text-blue-600' },
              { step: '02', icon: Users, title: 'Add Teachers & Students', desc: 'Import or manually add your staff and student roster.', color: 'bg-green-50 text-green-600' },
              { step: '03', icon: BookOpen, title: 'Set Up Classes', desc: 'Create classes, assign teachers, and set up your timetable.', color: 'bg-purple-50 text-purple-600' },
              { step: '04', icon: TrendingUp, title: 'Track & Improve', desc: 'Monitor performance with analytics and make data-driven decisions.', color: 'bg-orange-50 text-orange-600' },
            ].map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-center">
                {i < 3 && <div className="hidden md:block absolute top-10 -right-4 w-8 border-t-2 border-dashed border-gray-200 z-10"></div>}
                <div className="text-xs font-bold text-gray-300 mb-3">{s.step}</div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${s.color}`}>
                  <s.icon size={24} />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.getInTouch')}</h2>
            <p className="text-gray-500 mb-8">{t('landing.getInTouchSub')}</p>
            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email', val: 'hello@eduverse.com' },
                { icon: Phone, label: 'Phone', val: '+1 800 123 456' },
                { icon: MapPin, label: 'Address', val: '123 Education Ave, Suite 100' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <c.icon size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{c.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{c.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleContact} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-5">{t('landing.sendMessage')}</h3>
            {sent && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">✅ Message sent! We'll get back to you soon.</div>}
            {sendError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{sendError}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">{t('landing.firstName')}</label><input className="input" placeholder="Jean" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
                <div><label className="label">{t('landing.lastName')}</label><input className="input" placeholder="Habimana" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              </div>
              <div><label className="label">{t('common.email')}</label><input type="email" className="input" placeholder="you@school.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label className="label">{t('landing.schoolName')}</label><input className="input" placeholder="Your school name" value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} /></div>
              <div><label className="label">{t('landing.message')}</label><textarea className="input h-28 resize-none" placeholder={t('landing.messagePlaceholder')} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required></textarea></div>
              <button type="submit" disabled={sending} className="btn-primary w-full justify-center py-2.5 disabled:opacity-60">
                {sending ? 'Sending...' : <>{t('landing.sendBtn')} <ArrowRight size={15} /></>}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 blue-gradient">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">{t('landing.readyToTransform')}</h2>
          <p className="text-blue-100 mb-8 text-lg">{t('landing.readySubtitle')}</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              {t('landing.getStartedFree')} <ChevronRight size={18} />
            </Link>
            <a href="#contact" className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
              {t('landing.requestDemo')}
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <BookOpen size={15} className="text-white" />
                </div>
                <span className="text-white font-bold">EduVerse</span>
              </div>
              <p className="text-sm leading-relaxed">Smart school management platform connecting schools, teachers, students and parents.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm">Product</p>
              <ul className="space-y-2 text-sm">
                {['Features', 'Pricing', 'Security', 'API Docs'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm">Company</p>
              <ul className="space-y-2 text-sm">
                {['About', 'Blog', 'Careers', 'Contact'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm">Support</p>
              <ul className="space-y-2 text-sm">
                {['Help Center', 'Terms of Service', 'Privacy Policy', 'Status'].map(l => <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm">{t('landing.allRightsReserved')}</p>
            <p className="text-sm">{t('landing.madeWith')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
