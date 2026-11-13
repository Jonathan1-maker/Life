import { Bell, Search, ChevronDown, Check, X, Trash2, Globe, Menu } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

const NAV_PAGES: Record<Role, { label: string; path: string; keywords?: string }[]> = {
  super_admin: [
    { label: 'Dashboard', path: '/super-admin/dashboard' },
    { label: 'Schools', path: '/super-admin/schools', keywords: 'school list manage' },
    { label: 'Users', path: '/super-admin/users', keywords: 'user accounts' },
    { label: 'Subscriptions', path: '/super-admin/subscriptions', keywords: 'plans billing' },
    { label: 'Analytics', path: '/super-admin/analytics', keywords: 'stats reports' },
    { label: 'Support', path: '/super-admin/support', keywords: 'tickets help' },
    { label: 'Messages', path: '/super-admin/messages' },
    { label: 'Audit Logs', path: '/super-admin/audit-logs', keywords: 'activity history' },
    { label: 'Reports', path: '/super-admin/reports' },
    { label: 'Settings', path: '/super-admin/settings' },
  ],
  school_admin: [
    { label: 'Dashboard', path: '/school-admin/dashboard' },
    { label: 'Classes', path: '/school-admin/classes', keywords: 'class rooms' },
    { label: 'Teachers', path: '/school-admin/teachers', keywords: 'staff' },
    { label: 'Students', path: '/school-admin/students', keywords: 'pupils learners' },
    { label: 'Parents', path: '/school-admin/parents', keywords: 'guardians' },
    { label: 'Subjects', path: '/school-admin/subjects', keywords: 'courses' },
    { label: 'Timetable', path: '/school-admin/timetable', keywords: 'schedule periods' },
    { label: 'Terms', path: '/school-admin/terms', keywords: 'academic year' },
    { label: 'Reports', path: '/school-admin/reports', keywords: 'report cards' },
    { label: 'Messages', path: '/school-admin/messages' },
    { label: 'Settings', path: '/school-admin/settings' },
  ],
  teacher: [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'My Classes', path: '/teacher/classes' },
    { label: 'Attendance', path: '/teacher/attendance' },
    { label: 'Assignments', path: '/teacher/assignments' },
    { label: 'Marks', path: '/teacher/marks', keywords: 'grades results' },
  ],
  student: [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'My Courses', path: '/student/courses' },
    { label: 'Assignments', path: '/student/assignments' },
    { label: 'Results', path: '/student/results', keywords: 'marks grades' },
    { label: 'Timetable', path: '/student/timetable', keywords: 'schedule' },
  ],
  parent: [
    { label: 'Dashboard', path: '/parent/dashboard' },
    { label: 'My Children', path: '/parent/children' },
    { label: 'Messages', path: '/parent/messages' },
  ],
}

const TYPE_COLORS: Record<string, string> = {
  Student:  'bg-blue-100 text-blue-700',
  Teacher:  'bg-green-100 text-green-700',
  Class:    'bg-purple-100 text-purple-700',
  Subject:  'bg-orange-100 text-orange-700',
  School:   'bg-teal-100 text-teal-700',
  User:     'bg-pink-100 text-pink-700',
  Page:     'bg-gray-100 text-gray-600',
}

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const role = (user?.role || 'school_admin') as Role
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')
  }

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [focused, setFocused] = useState(-1)

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevUnread = useRef(0)

  // Nav page suggestions — instant, no API
  const pageMatches = search.trim().length > 0
    ? (NAV_PAGES[role] || []).filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        (p.keywords || '').toLowerCase().includes(search.toLowerCase())
      ).map(p => ({ id: p.path, label: p.label, sub: p.path, type: 'Page', path: p.path }))
    : []

  // API results — only when logged in and 2+ chars
  const { data: apiResults = [], isFetching } = useQuery({
    queryKey: ['search', search],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(search)}`).then(r => r.data.data || []),
    enabled: !!user && search.trim().length >= 2,
    staleTime: 10000,
    retry: false,
  })

  const allResults = [...pageMatches, ...apiResults].slice(0, 12)

  // Notifications
  const { data: notifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data || []),
    enabled: !!user,
    refetchInterval: 5000,
    retry: false,
  })

  const unread = (notifs || []).filter((n: any) => !n.is_read).length

  useEffect(() => { prevUnread.current = unread }, [unread])

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const clearAll = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const handleNotifClick = (n: any) => {
    if (!n.is_read) markOneMutation.mutate(n.id)
    setShowNotifs(false)
    if (n.link) navigate(n.link)
  }

  const handleResultClick = (r: any) => {
    setSearch('')
    setShowSearch(false)
    setFocused(-1)
    navigate(r.path)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearch || allResults.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)) }
    if (e.key === 'Enter' && focused >= 0) handleResultClick(allResults[focused])
    if (e.key === 'Escape') { setShowSearch(false); setSearch(''); inputRef.current?.blur() }
  }

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false); setFocused(-1)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-10 gap-3">

      {/* Hamburger — mobile only */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0">
        <Menu size={20} className="text-gray-600" />
      </button>

      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md hidden sm:flex" ref={searchRef}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSearch(true); setFocused(-1) }}
            onFocus={() => setShowSearch(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('common.searchPlaceholder')}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowSearch(false); inputRef.current?.focus() }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}

          {/* Dropdown */}
          {showSearch && search.trim().length >= 1 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              {isFetching && apiResults.length === 0 && pageMatches.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Searching…</p>
              ) : allResults.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No results for "{search}"</p>
              ) : (
                <ul className="py-1 max-h-72 overflow-y-auto">
                  {allResults.map((r: any, i: number) => (
                    <li
                      key={`${r.type}-${r.id}`}
                      onMouseDown={() => handleResultClick(r)}
                      onMouseEnter={() => setFocused(i)}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${focused === i ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[r.type] || TYPE_COLORS.Page}`}>
                        {r.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          title={t('language.switchTo')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
        >
          <Globe size={15} />
          {i18n.language === 'en' ? 'FR' : 'EN'}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className={unread > 0 ? 'text-primary-600' : 'text-gray-600'} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm">
                  {t('common.notifications')} {unread > 0 && <span className="ml-1 text-xs text-primary-600">({unread} new)</span>}
                </p>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={() => markAllMutation.mutate()} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      <Check size={12} /> {t('common.markAllRead')}
                    </button>
                  )}
                  {(notifs || []).length > 0 && (
                    <button onClick={() => clearAll.mutate()} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> {t('common.clear')}
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {(notifs || []).length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">{t('common.noNotifications')}</p>
                ) : (
                  (notifs || []).map((n: any) => (
                    <div key={n.id} onClick={() => handleNotifClick(n)}
                      className={`px-4 py-3 border-b border-gray-50 transition-colors group ${!n.is_read ? 'bg-blue-50/40' : ''} ${n.link ? 'cursor-pointer hover:bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-start gap-2">
                        {!n.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                        <div className={`flex-1 ${!n.is_read ? '' : 'ml-4'}`}>
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif.mutate(n.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 flex-shrink-0 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
            <p className="text-xs text-gray-400 leading-tight capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  )
}
