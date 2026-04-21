import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'

const navItems = [
  { path: '/admin', icon: 'fas fa-tachometer-alt', label: 'لوحة التحكم', exact: true },
  { path: '/admin/students', icon: 'fas fa-users', label: 'الطلاب' },
  { path: '/admin/courses', icon: 'fas fa-book', label: 'الكورسات' },
  { path: '/admin/lectures', icon: 'fas fa-play-circle', label: 'المحاضرات' },
  { path: '/admin/exams', icon: 'fas fa-file-alt', label: 'الامتحانات' },
  { path: '/admin/lecture-codes', icon: 'fas fa-key', label: 'أكواد المحاضرات' },
  { path: '/admin/exam-codes', icon: 'fas fa-ticket-alt', label: 'أكواد الامتحانات' },
  { path: '/admin/results', icon: 'fas fa-chart-bar', label: 'النتائج' },
  { path: '/admin/online', icon: 'fas fa-circle', label: 'المتصلون الآن' },
  { path: '/admin/notifications', icon: 'fas fa-bell', label: 'الإشعارات' },
  { path: '/admin/bans', icon: 'fas fa-ban', label: 'الحظر' },
  { path: '/admin/admins', icon: 'fas fa-user-shield', label: 'الأدمنز' },
  { path: '/admin/settings', icon: 'fas fa-cog', label: 'الإعدادات' },
  { path: '/admin/made-by', icon: 'fas fa-star', label: 'كرة صنع بواسطة' },
]

export default function AdminLayout({ children, title }) {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const isActive = (item) => item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)', direction: 'rtl' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--bg2)', borderLeft: '1px solid var(--border)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="font-black" style={{ color: 'var(--primary)' }}>🛡️ لوحة التحكم</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/5">✕</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.filter(item => {
            if (!admin?.is_super_admin) {
              if (item.path === '/admin/admins' && !admin?.permissions?.manage_admins) return false
              if (item.path === '/admin/settings' && !admin?.permissions?.manage_settings) return false
            }
            return true
          }).map(item => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
              style={{ background: isActive(item) ? 'rgba(108,99,255,0.15)' : 'transparent', color: isActive(item) ? 'var(--primary)' : 'var(--text2)', fontWeight: isActive(item) ? 700 : 400 }}>
              <i className={item.icon + ' w-4 text-center'}></i>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-xs mb-2" style={{ color: 'var(--text2)' }}>{admin?.display_name}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300">
            <i className="fas fa-sign-out-alt"></i> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-white/5">
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="font-black text-lg">{title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
