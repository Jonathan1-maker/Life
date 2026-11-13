import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { Search, Plus, Shield, GraduationCap, UserCheck, Baby, Edit, Trash2, Eye, Users } from 'lucide-react'
import { format } from 'date-fns'

const roleConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  super_admin:  { icon: Shield,       color: 'bg-red-100 text-red-600',    label: 'Super Admin' },
  school_admin: { icon: UserCheck,    color: 'bg-blue-100 text-blue-600',  label: 'School Admin' },
  teacher:      { icon: Users,        color: 'bg-purple-100 text-purple-600', label: 'Teacher' },
  student:      { icon: GraduationCap,color: 'bg-green-100 text-green-600', label: 'Student' },
  parent:       { icon: Baby,         color: 'bg-orange-100 text-orange-600', label: 'Parent' },
}

export default function SuperUsers() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', role],
    queryFn: () => api.get('/users', { params: { role: role === 'all' ? undefined : role, limit: 100 } }).then(r => r.data.data || []),
    retry: false,
  })

  const { data: counts } = useQuery({
    queryKey: ['user-counts'],
    queryFn: () => api.get('/analytics/platform').then(r => r.data.data),
    retry: false,
  })

  const users: any[] = (usersData || []).filter((u: any) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const roleCounts: Record<string, number> = {
    super_admin:  1,
    school_admin: counts?.schools?.total ?? 0,
    teacher:      counts?.teachers?.total ?? 0,
    student:      counts?.students?.total ?? 0,
    parent:       counts?.parents ?? 0,
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-sm text-gray-500">Manage platform users across all schools</p>
        </div>
        <button className="btn-primary"><Plus size={15} /> Add User</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(roleConfig).map(([key, { icon: Icon, color, label }]) => (
          <div key={key} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}><Icon size={17} /></div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-lg font-bold text-gray-800">{(roleCounts[key] ?? 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'school_admin', 'teacher', 'student', 'parent'].map(r => (
            <button key={r} onClick={() => setRole(r)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${role === r ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <Users size={40} className="mb-2 opacity-40" />
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Status</th>
                <th className="table-header">Joined</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const rc = roleConfig[u.role] || roleConfig.student
                const Icon = rc.icon
                return (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                          {u.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge gap-1 ${rc.color}`}><Icon size={11} />{rc.label}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${u.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{u.is_active ? 'active' : 'inactive'}</span>
                    </td>
                    <td className="table-cell text-gray-400">{u.created_at ? format(new Date(u.created_at), 'MMM yyyy') : '—'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={14} className="text-gray-500" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit size={14} className="text-gray-500" /></button>
                        <button className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
