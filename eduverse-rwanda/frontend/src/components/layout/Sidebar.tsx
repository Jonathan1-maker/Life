import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, School, Users, CreditCard, BarChart3, MessageSquare,
  HeadphonesIcon, ClipboardList, FileText, Settings, LogOut, BookOpen,
  GraduationCap, CalendarDays, CheckSquare, TrendingUp, UserCheck,
  Home, Baby, Bell, CalendarRange, X
} from 'lucide-react'

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

interface Props {
  role: Role
  open: boolean
  onClose: () => void
}

export default function Sidebar({ role, open, onClose }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems: Record<Role, { label: string; icon: React.ElementType; path: string }[]> = {
    super_admin: [
      { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/super-admin/dashboard' },
      { label: t('nav.schools'), icon: School, path: '/super-admin/schools' },
      { label: t('nav.users'), icon: Users, path: '/super-admin/users' },
      { label: t('nav.subscriptions'), icon: CreditCard, path: '/super-admin/subscriptions' },
      { label: t('nav.analytics'), icon: BarChart3, path: '/super-admin/analytics' },
      { label: t('nav.support'), icon: HeadphonesIcon, path: '/super-admin/support' },
      { label: t('nav.messages'), icon: MessageSquare, path: '/super-admin/messages' },
      { label: t('nav.settings'), icon: Settings, path: '/super-admin/settings' },
      { label: t('nav.auditLogs'), icon: ClipboardList, path: '/super-admin/audit-logs' },
      { label: t('nav.reports'), icon: FileText, path: '/super-admin/reports' },
    ],
    school_admin: [
      { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/school-admin/dashboard' },
      { label: t('nav.classes'), icon: BookOpen, path: '/school-admin/classes' },
      { label: t('nav.teachers'), icon: UserCheck, path: '/school-admin/teachers' },
      { label: t('nav.students'), icon: GraduationCap, path: '/school-admin/students' },
      { label: t('nav.parents'), icon: Baby, path: '/school-admin/parents' },
      { label: t('nav.subjects'), icon: BookOpen, path: '/school-admin/subjects' },
      { label: t('nav.timetable'), icon: CalendarDays, path: '/school-admin/timetable' },
      { label: t('nav.terms'), icon: CalendarRange, path: '/school-admin/terms' },
      { label: t('nav.reports'), icon: FileText, path: '/school-admin/reports' },
      { label: t('nav.messages'), icon: MessageSquare, path: '/school-admin/messages' },
      { label: t('nav.settings'), icon: Settings, path: '/school-admin/settings' },
    ],
    teacher: [
      { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/teacher/dashboard' },
      { label: t('nav.myClasses'), icon: BookOpen, path: '/teacher/classes' },
      { label: t('nav.attendance'), icon: CheckSquare, path: '/teacher/attendance' },
      { label: t('nav.assignments'), icon: ClipboardList, path: '/teacher/assignments' },
      { label: t('nav.marks'), icon: TrendingUp, path: '/teacher/marks' },
    ],
    student: [
      { label: t('nav.dashboard'), icon: Home, path: '/student/dashboard' },
      { label: t('nav.myCourses'), icon: BookOpen, path: '/student/courses' },
      { label: t('nav.assignments'), icon: ClipboardList, path: '/student/assignments' },
      { label: t('nav.results'), icon: TrendingUp, path: '/student/results' },
      { label: t('nav.timetable'), icon: CalendarDays, path: '/student/timetable' },
    ],
    parent: [
      { label: t('nav.dashboard'), icon: Home, path: '/parent/dashboard' },
      { label: t('nav.myChildren'), icon: Baby, path: '/parent/children' },
      { label: t('nav.messages'), icon: MessageSquare, path: '/parent/messages' },
      { label: t('nav.announcements'), icon: Bell, path: '/parent/dashboard' },
    ],
  }

  const roleLabels: Record<Role, string> = {
    super_admin: t('roles.super_admin'),
    school_admin: t('roles.school_admin'),
    teacher: t('roles.teacher'),
    student: t('roles.student'),
    parent: t('roles.parent'),
  }

  const items = navItems[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    onClose()
  }

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-60 bg-white border-r border-gray-100 flex flex-col h-screen
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-primary-600 text-sm">EduVerse</span>
            <p className="text-xs text-gray-400 leading-none">Rwanda</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {items.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            onClick={handleNavClick}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={17} />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  )
}
