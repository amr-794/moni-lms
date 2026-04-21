import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import ThemeProvider from './components/ThemeProvider'
import BallMenu from './components/BallMenu'
import { useRealtime } from './hooks/useRealtime.jsx'
import { useOnlinePresence } from './hooks/useOnlinePresence.jsx'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/student/Dashboard'
import Watch from './pages/student/Watch'
import StudentExams from './pages/student/Exams'
import TakeExam from './pages/student/TakeExam'
import Profile from './pages/student/Profile'
import Notifications from './pages/student/Notifications'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCourses from './pages/admin/Courses'
import AdminLectures from './pages/admin/Lectures'
import AdminExams from './pages/admin/Exams'
import AdminStudents from './pages/admin/Students'
import AdminLectureCodes from './pages/admin/LectureCodes'
import AdminExamCodes from './pages/admin/ExamCodes'
import AdminResults from './pages/admin/Results'
import AdminOnlineUsers from './pages/admin/OnlineUsers'
import AdminNotifications from './pages/admin/Notifications'
import AdminAdmins from './pages/admin/Admins'
import AdminBans from './pages/admin/Bans'
import AdminSettings from './pages/admin/Settings'
import AdminMadeBy from './pages/admin/MadeBy'

function ProtectedStudent({ children }) {
  const { student, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
  return student ? children : <Navigate to="/login" replace />
}

function ProtectedAdmin({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
  return admin ? children : <Navigate to="/admin/login" replace />
}

function AppContent() {
  useRealtime()
  useOnlinePresence()

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedStudent><Dashboard /></ProtectedStudent>} />
        <Route path="/watch/:id" element={<ProtectedStudent><Watch /></ProtectedStudent>} />
        <Route path="/exams" element={<ProtectedStudent><StudentExams /></ProtectedStudent>} />
        <Route path="/exam/:id" element={<ProtectedStudent><TakeExam /></ProtectedStudent>} />
        <Route path="/profile" element={<ProtectedStudent><Profile /></ProtectedStudent>} />
        <Route path="/notifications" element={<ProtectedStudent><Notifications /></ProtectedStudent>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login isAdmin />} />
        <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
        <Route path="/admin/courses" element={<ProtectedAdmin><AdminCourses /></ProtectedAdmin>} />
        <Route path="/admin/lectures" element={<ProtectedAdmin><AdminLectures /></ProtectedAdmin>} />
        <Route path="/admin/exams" element={<ProtectedAdmin><AdminExams /></ProtectedAdmin>} />
        <Route path="/admin/students" element={<ProtectedAdmin><AdminStudents /></ProtectedAdmin>} />
        <Route path="/admin/lecture-codes" element={<ProtectedAdmin><AdminLectureCodes /></ProtectedAdmin>} />
        <Route path="/admin/exam-codes" element={<ProtectedAdmin><AdminExamCodes /></ProtectedAdmin>} />
        <Route path="/admin/results" element={<ProtectedAdmin><AdminResults /></ProtectedAdmin>} />
        <Route path="/admin/online" element={<ProtectedAdmin><AdminOnlineUsers /></ProtectedAdmin>} />
        <Route path="/admin/notifications" element={<ProtectedAdmin><AdminNotifications /></ProtectedAdmin>} />
        <Route path="/admin/admins" element={<ProtectedAdmin><AdminAdmins /></ProtectedAdmin>} />
        <Route path="/admin/bans" element={<ProtectedAdmin><AdminBans /></ProtectedAdmin>} />
        <Route path="/admin/settings" element={<ProtectedAdmin><AdminSettings /></ProtectedAdmin>} />
        <Route path="/admin/made-by" element={<ProtectedAdmin><AdminMadeBy /></ProtectedAdmin>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BallMenu />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
