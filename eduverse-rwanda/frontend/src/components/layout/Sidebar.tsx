import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import {
  LayoutDashboard, School, Users, CreditCard, BarChart3, MessageSquare,
  HeadphonesIcon, ClipboardList, FileText, Settings, LogOut, BookOpen,
  GraduationCap, CalendarDays, CheckSquare, TrendingUp, UserCheck,
  Home, Baby, Bell, CalendarRange
} from 'lucide-react'

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

const navItems: Record<Role, { label: string; icon: React.ElementType; path: string }[]> = {
  super_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin/dashboard' },
    { label: 'Schools', icon: School, path: '/super-admin/schools' },
    { label: 'Users', icon: Users, path: '/super-admin/users' },
    { label: 'Subscriptions', icon: CreditCard, path: '/super-admin/subscriptions' },
    { label: 'Analytics', icon: BarChart3, path: '/super-admin/analytics' },
    { label: 'Support', icon: HeadphonesIcon, path: '/super-admin/support' },
    { label: 'Messages', icon: MessageSquare, path: '/super-admin/messages' },
    { label: 'Settings', icon: Settings, path: '/super-admin/settings' },
    { label: 'Audit Logs', icon: ClipboardList, path: '/super-admin/audit-logs' },
    { label: 'Reports', icon: FileText, path: '/super-admin/reports' },
  ],
  school_admin: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/school-admin/dashboard' },
    { label: 'Classes', icon: BookOpen, path: '/school-admin/classes' },
    { label: 'Teachers', icon: UserCheck, path: '/school-admin/teachers' },
    { label: 'Students', icon: GraduationCap, path: '/school-admin/students' },
    { label: 'Parents', icon: Baby, path: '/school-admin/parents' },
    { label: 'Subjects', icon: BookOpen, path: '/school-admin/subjects' },
    { label: 'Timetable', icon: CalendarDays, path: '/school-admin/timetable' },
    { label: 'Terms', icon: CalendarRange, path: '/school-admin/terms' },
    { label: 'Reports', icon: FileText, path: '/school-admin/reports' },
    { label: 'Messages', icon: MessageSquare, path: '/school-admin/messages' },
    { label: 'Settings', icon: Settings, path: '/school-admin/settings' },
  ],
  teacher: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { label: 'My Classes', icon: BookOpen, path: '/teacher/classes' },
    { label: 'Attendance', icon: CheckSquare, path: '/teacher/attendance' },
    { label: 'Assignments', icon: ClipboardList, path: '/teacher/assignments' },
    { label: 'Marks', icon: TrendingUp, path: '/teacher/marks' },
  ],
  student: [
    { label: 'Dashboard', icon: Home, path: '/student/dashboard' },
    { label: 'My Courses', icon: BookOpen, path: '/student/courses' },
    { label: 'Assignments', icon: ClipboardList, path: '/student/assignments' },
    { label: 'Results', icon: TrendingUp, path: '/student/results' },
    { label: 'Timetable', icon: CalendarDays, path: '/student/timetable' },
  ],
  parent: [
    { label: 'Dashboard', icon: Home, path: '/parent/dashboard' },
    { label: 'My Children', icon: Baby, path: '/parent/children' },
    { label: 'Messages', icon: MessageSquare, path: '/parent/messages' },
    { label: 'Announcements', icon: Bell, path: '/parent/dashboard' },
  ],
}

const roleLabels: Record<Role, string> = {
  super_admin: 'Platform Owner',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
}

export default function Sidebar({ role }: { role: Role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const items = navItems[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-primary-600 text-sm">EduVerse</span>
            <p className="text-xs text-gray-400 leading-none">Rwanda</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
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
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
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
          Logout
        </button>
      </div>
    </aside>
  )
}
