import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Navbar() {
  const { student, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-black text-xl" style={{ color: 'var(--primary)' }}>
          📚 منصة محمود منير
        </Link>

        {student ? (
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-white/5 transition-all">
              <i className="fas fa-bell"></i>
            </Link>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--primary)' }}>
                  {student.full_name?.[0]}
                </div>
                <span className="text-sm hidden sm:block">{student.full_name}</span>
                <i className="fas fa-chevron-down text-xs"></i>
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-12 w-48 rounded-2xl shadow-xl z-50 py-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm">
                    <i className="fas fa-home w-4"></i> الرئيسية
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-sm">
                    <i className="fas fa-user w-4"></i> الملف الشخصي
                  </Link>
                  <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-red-400 text-sm w-full text-right">
                    <i className="fas fa-sign-out-alt w-4"></i> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn-secondary text-sm">دخول</Link>
            <Link to="/register" className="btn-primary text-sm">تسجيل</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
