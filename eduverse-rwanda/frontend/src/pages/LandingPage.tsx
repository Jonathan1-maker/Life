import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  ArrowRight, Play, School, BarChart3, Brain, Users, BookOpen, MessageCircle,
  ChevronRight, CheckCircle, Star, Phone, Mail, MapPin, Shield, Zap, Globe,
  TrendingUp, Award, Clock
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



const plans = [
  {
    name: 'Basic', price: '$49', period: '/month', color: 'border-gray-200',
    badge: '', badgeColor: '',
    features: ['Up to 200 students', '5 teacher accounts', 'Basic analytics', 'Email support', 'Attendance tracking'],
    cta: 'Get Started', ctaClass: 'btn-secondary w-full justify-center',
  },
  {
    name: 'Standard', price: '$149', period: '/month', color: 'border-primary-500',
    badge: 'Most Popular', badgeColor: 'bg-primary-600 text-white',
    features: ['Up to 800 students', '20 teacher accounts', 'Advanced analytics', 'Priority support', 'AI Study Assistant', 'Parent portal'],
    cta: 'Get Started', ctaClass: 'btn-primary w-full justify-center',
  },
  {
    name: 'Premium', price: '$299', period: '/month', color: 'border-purple-400',
    badge: '', badgeColor: '',
    features: ['Up to 2,000 students', 'Unlimited teachers', 'Full analytics suite', '24/7 support', 'AI + Portfolio', 'Custom branding', 'API access'],
    cta: 'Get Started', ctaClass: 'btn-secondary w-full justify-center',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', color: 'border-orange-400',
    badge: '', badgeColor: '',
    features: ['Unlimited students', 'Unlimited everything', 'Dedicated account manager', 'SLA guarantee', 'On-premise option', 'Custom integrations'],
    cta: 'Contact Us', ctaClass: 'btn-secondary w-full justify-center',
  },
]

const testimonials = [
  {
    name: 'Jean Pierre Habimana', role: 'Principal, GS Saint Paul Kimironko',
    text: 'EduVerse Rwanda transformed how we manage our school. The analytics dashboard saves us hours every week.',
    avatar: 'J', color: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Marie Claire Uwimana', role: 'Mathematics Teacher, Lycée de Kigali',
    text: 'Taking attendance and entering marks used to take forever. Now it takes minutes. My students love the portal too!',
    avatar: 'M', color: 'bg-green-100 text-green-700',
  },
  {
    name: 'Carine Mukamana', role: 'S6 Student, GSAP Kagarama',
    text: 'The AI study assistant helped me prepare for my national exams. I can see all my results and assignments in one place.',
    avatar: 'C', color: 'bg-purple-100 text-purple-700',
  },
]

export default function LandingPage() {
  const { data: dbStats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/analytics/public-stats').then(r => r.data.data),
    retry: false,
  })

  const stats = [
    { val: dbStats?.totalSchools ?? 0, label: 'Schools Registered', icon: School },
    { val: dbStats?.totalStudents ?? 0, label: 'Students Enrolled', icon: Users },
    { val: dbStats?.totalTeachers ?? 0, label: 'Teachers Active', icon: Award },
    { val: dbStats?.uptime ?? 0, label: 'Uptime Guaranteed', icon: Zap },
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
              <span className="text-xs text-gray-400 ml-1 font-medium">RWANDA</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-primary-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">Contact</a>
          </div>
          <Link to="/login" className="btn-primary">
            Sign In <ArrowRight size={15} />
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
              Manage Schools,<br />
              <span className="text-primary-600">Empower Education,</span><br />
              Build the Future
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-md leading-relaxed">
              EduVerse Rwanda is a smart school management and learning platform that connects schools, teachers, students and parents in one place.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/login" className="btn-primary px-6 py-3 text-base">
                Get Started Free <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn-secondary px-6 py-3 text-base gap-2">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                  <Play size={12} className="text-white ml-0.5" />
                </div>
                See Features
              </a>
            </div>

            {/* Feature icons row */}
            <div className="mt-12">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">Powerful Features</p>
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
              <Zap size={13} /> Everything You Need
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Powerful Features for Every Role</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">From multi-school management to AI-powered learning, EduVerse has everything your school needs.</p>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-3">One Platform, Many Roles</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Every stakeholder gets a tailored experience designed for their specific needs.</p>
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
                    Access <ArrowRight size={11} />
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
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Get Started in Minutes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Setting up your school on EduVerse is fast and easy.</p>
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

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-green-100">
              <CheckCircle size={13} /> Simple Pricing
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Plan</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Flexible plans for schools of every size. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => (
              <div key={p.name} className={`relative rounded-2xl border-2 ${p.color} p-6 flex flex-col hover:shadow-lg transition-shadow ${p.badge ? 'shadow-lg' : ''}`}>
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${p.badgeColor} text-xs font-bold px-3 py-1 rounded-full`}>
                    {p.badge}
                  </div>
                )}
                <div className="mb-5">
                  <p className="font-bold text-gray-800 text-lg">{p.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-gray-900">{p.price}</span>
                    <span className="text-gray-400 text-sm">{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={p.ctaClass}>
                  {p.cta} <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Trusted by Educators Across Rwanda</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Hear what schools, teachers, and students say about EduVerse.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-100">
              <Globe size={13} /> About EduVerse Rwanda
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Rwanda's Education System</h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              EduVerse Rwanda was built specifically for Rwandan schools — supporting the national curriculum, REB standards, and multilingual communication in Kinyarwanda, English, and French.
            </p>
            <p className="text-gray-500 leading-relaxed mb-6">
              Our mission is to digitize education administration and improve learning outcomes for every student in Rwanda, from primary schools in rural areas to top secondary schools in Kigali.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Clock, label: 'Founded', val: '2023' },
                { icon: Globe, label: 'Coverage', val: 'All 5 Provinces' },
                { icon: Users, label: 'Team', val: '30+ Experts' },
                { icon: Award, label: 'Certified', val: 'REB Approved' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                    <s.icon size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-sm font-bold text-gray-800">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=700&h=500&fit=crop"
              alt="Education in Rwanda"
              className="w-full h-96 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <p className="font-bold text-xl">Empowering Rwandan Education</p>
              <p className="text-blue-200 text-sm">One school at a time</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-500 mb-8">Have questions or want to get a demo? We'd love to hear from you.</p>
            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email', val: 'hello@eduverse.rw' },
                { icon: Phone, label: 'Phone', val: '+250 788 123 456' },
                { icon: MapPin, label: 'Address', val: 'KG 7 Ave, Kigali, Rwanda' },
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-5">Send us a message</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">First Name</label><input className="input" placeholder="Jean" /></div>
                <div><label className="label">Last Name</label><input className="input" placeholder="Habimana" /></div>
              </div>
              <div><label className="label">Email</label><input type="email" className="input" placeholder="you@school.rw" /></div>
              <div><label className="label">School Name</label><input className="input" placeholder="Your school name" /></div>
              <div><label className="label">Message</label><textarea className="input h-28 resize-none" placeholder="Tell us about your school and needs..."></textarea></div>
              <button className="btn-primary w-full justify-center py-2.5">Send Message <ArrowRight size={15} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 blue-gradient">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your School?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join 124+ schools already using EduVerse Rwanda. Get started free today.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              Get Started Free <ChevronRight size={18} />
            </Link>
            <a href="#contact" className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors border border-white/20">
              Request a Demo
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
                <span className="text-white font-bold">EduVerse Rwanda</span>
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
            <p className="text-sm">© 2025 EduVerse Rwanda. All rights reserved.</p>
            <p className="text-sm">Made with ❤️ in Kigali, Rwanda 🇷🇼</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
