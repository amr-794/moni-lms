import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Login({ isAdmin = false }) {
  const { loginStudent, loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', username: '', password: '', remember_me: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isAdmin) {
        await loginAdmin(form.username, form.password)
        navigate('/admin')
      } else {
        await loginStudent(form.identifier, form.password, form.remember_me)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{isAdmin ? '🛡️' : '📚'}</div>
          <h1 className="text-2xl font-black">{isAdmin ? 'لوحة التحكم' : 'تسجيل الدخول'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {isAdmin ? 'مرحباً بك في لوحة الأدمن' : 'أهلاً بك في منصة محمود منير'}
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isAdmin ? (
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>اسم المستخدم</label>
                <input className="input-field" placeholder="username" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
            ) : (
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الهاتف أو البريد الإلكتروني</label>
                <input className="input-field" placeholder="0100000000 أو example@mail.com"
                  value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} required />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>كلمة المرور</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {!isAdmin && (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.remember_me} onChange={e => setForm({ ...form, remember_me: e.target.checked })}
                  className="w-4 h-4 rounded" style={{ accentColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--text2)' }}>تذكرني لمدة 30 يوم</span>
              </label>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'دخول'}
            </button>
          </form>

          {!isAdmin && (
            <p className="text-center text-sm mt-4" style={{ color: 'var(--text2)' }}>
              ليس لديك حساب؟{' '}
              <Link to="/register" style={{ color: 'var(--primary)' }} className="font-bold hover:underline">سجل الآن</Link>
            </p>
          )}
          {isAdmin && (
            <p className="text-center text-sm mt-4" style={{ color: 'var(--text2)' }}>
              <Link to="/" style={{ color: 'var(--primary)' }}>← العودة للموقع</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
