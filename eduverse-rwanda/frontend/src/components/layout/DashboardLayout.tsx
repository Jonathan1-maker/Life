import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

export default function DashboardLayout({ role }: { role: Role }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
