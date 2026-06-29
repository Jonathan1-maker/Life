import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'

// Super Admin
import SuperDashboard from './pages/super-admin/Dashboard'
import SuperSchools from './pages/super-admin/Schools'
import SuperUsers from './pages/super-admin/Users'
import SuperSubscriptions from './pages/super-admin/Subscriptions'
import SuperAnalytics from './pages/super-admin/Analytics'
import SuperMessages from './pages/super-admin/Messages'
import SuperSupport from './pages/super-admin/Support'
import SuperAuditLogs from './pages/super-admin/AuditLogs'
import SuperReports from './pages/super-admin/Reports'

// School Admin
import SchoolDashboard from './pages/school-admin/Dashboard'
import SchoolClasses from './pages/school-admin/Classes'
import SchoolTeachers from './pages/school-admin/Teachers'
import SchoolStudents from './pages/school-admin/Students'
import SchoolParents from './pages/school-admin/Parents'
import SchoolSubjects from './pages/school-admin/Subjects'
import SchoolTimetable from './pages/school-admin/Timetable'
import SchoolReports from './pages/school-admin/Reports'
import SchoolSettings from './pages/school-admin/Settings'
import SchoolTerms from './pages/school-admin/Terms'
import SchoolMessages from './pages/school-admin/Messages'

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherClasses from './pages/teacher/Classes'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherMarks from './pages/teacher/Marks'

// Student
import StudentDashboard from './pages/student/Dashboard'
import StudentCourses from './pages/student/Courses'
import StudentAssignments from './pages/student/Assignments'
import StudentResults from './pages/student/Results'
import StudentTimetable from './pages/student/Timetable'

// Parent
import ParentDashboard from './pages/parent/Dashboard'
import ParentChildren from './pages/parent/Children'
import ParentMessages from './pages/parent/Messages'

type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { user, token } = useAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role as Role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map: Record<Role, string> = {
    super_admin: '/super-admin/dashboard',
    school_admin: '/school-admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard',
  }
  return <Navigate to={map[user.role as Role] || '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

      {/* Super Admin */}
      <Route path="/super-admin" element={<ProtectedRoute roles={['super_admin']}><DashboardLayout role="super_admin" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperDashboard />} />
        <Route path="schools" element={<SuperSchools />} />
        <Route path="users" element={<SuperUsers />} />
        <Route path="subscriptions" element={<SuperSubscriptions />} />
        <Route path="analytics" element={<SuperAnalytics />} />
        <Route path="messages" element={<SuperMessages />} />
        <Route path="support" element={<SuperSupport />} />
        <Route path="audit-logs" element={<SuperAuditLogs />} />
        <Route path="reports" element={<SuperReports />} />
        <Route path="settings" element={<SuperDashboard />} />
      </Route>

      {/* School Admin */}
      <Route path="/school-admin" element={<ProtectedRoute roles={['school_admin']}><DashboardLayout role="school_admin" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SchoolDashboard />} />
        <Route path="classes" element={<SchoolClasses />} />
        <Route path="teachers" element={<SchoolTeachers />} />
        <Route path="students" element={<SchoolStudents />} />
        <Route path="parents" element={<SchoolParents />} />
        <Route path="subjects" element={<SchoolSubjects />} />
        <Route path="timetable" element={<SchoolTimetable />} />
        <Route path="reports" element={<SchoolReports />} />
        <Route path="terms" element={<SchoolTerms />} />
        <Route path="messages" element={<SchoolMessages />} />
        <Route path="settings" element={<SchoolSettings />} />
      </Route>

      {/* Teacher */}
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><DashboardLayout role="teacher" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="marks" element={<TeacherMarks />} />
      </Route>

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute roles={['student']}><DashboardLayout role="student" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="timetable" element={<StudentTimetable />} />
      </Route>

      {/* Parent */}
      <Route path="/parent" element={<ProtectedRoute roles={['parent']}><DashboardLayout role="parent" /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="children" element={<ParentChildren />} />
        <Route path="messages" element={<ParentMessages />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
