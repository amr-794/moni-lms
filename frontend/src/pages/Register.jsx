import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Register() {
  const navigate = useNavigate()
  const [grades, setGrades] = useState([])
  const [form, setForm] = useState({ full_name: '', phone: '', parent_phone: '', email: '', password: '', grade_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/register', form)
      navigate('/login', { state: { message: 'تم إنشاء الحساب! يمكنك تسجيل الدخول الآن' } })
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-black">إنشاء حساب جديد</h1>
        </div>
        <div className="card">
          {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'full_name', label: 'الاسم بالكامل', placeholder: 'محمد أحمد علي' },
              { key: 'phone', label: 'رقم هاتفك', placeholder: '0100000000' },
              { key: 'parent_phone', label: 'رقم هاتف ولي الأمر', placeholder: '0100000000' },
              { key: 'email', label: 'البريد الإلكتروني', placeholder: 'example@gmail.com', type: 'email' },
              { key: 'password', label: 'كلمة المرور', placeholder: '••••••', type: 'password' },
            ].map(({ key, label, placeholder, type = 'text' }) => (
              <div key={key}>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>{label}</label>
                <input type={type} className="input-field" placeholder={placeholder}
                  value={form[key]} onChange={e => set(key, e.target.value)} required />
              </div>
            ))}
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الصف الدراسي</label>
              <select className="input-field" value={form.grade_id} onChange={e => set('grade_id', e.target.value)} required>
                <option value="">اختر صفك الدراسي</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'إنشاء الحساب'}
            </button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text2)' }}>
            لديك حساب؟{' '}<Link to="/login" style={{ color: 'var(--primary)' }} className="font-bold hover:underline">ادخل الآن</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
