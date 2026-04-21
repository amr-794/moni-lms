import { useState } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../utils/api'

export default function Profile() {
  const { student, setStudent } = useAuth()
  const [tab, setTab] = useState('info')
  const [pwForm, setPwForm] = useState({ new_password: '', confirm: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestChange = async () => {
    setLoading(true)
    try {
      await api.post('/api/auth/request-password-change')
      setMsg({ type: 'success', text: 'تم إرسال طلب تغيير كلمة المرور للأدمن' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'خطأ' })
    } finally { setLoading(false) }
  }

  const changePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm) return setMsg({ type: 'error', text: 'كلمتا المرور غير متطابقتين' })
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', { new_password: pwForm.new_password })
      setMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' })
      setPwForm({ new_password: '', confirm: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'خطأ' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card mb-6 text-center fade-in">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black mb-3"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            {student?.full_name?.[0]}
          </div>
          <h1 className="text-xl font-black">{student?.full_name}</h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--accent)' }}>كود: {student?.student_code}</p>
        </div>

        <div className="flex gap-2 mb-6">
          {['info', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
              style={{ background: tab === t ? 'var(--primary)' : 'var(--card)', color: tab === t ? 'white' : 'var(--text2)', border: '1px solid var(--border)' }}>
              {t === 'info' ? '👤 بياناتي' : '🔑 كلمة المرور'}
            </button>
          ))}
        </div>

        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: msg.type === 'success' ? 'rgba(67,233,123,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? 'var(--accent)' : '#f87171' }}>{msg.text}</div>}

        {tab === 'info' && (
          <div className="card space-y-4 fade-in">
            {[['الاسم الكامل', student?.full_name], ['الهاتف', student?.phone], ['هاتف ولي الأمر', student?.parent_phone], ['البريد الإلكتروني', student?.email]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text2)' }}>{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'password' && (
          <div className="card space-y-4 fade-in">
            {student?.password_change_approved ? (
              <>
                <p className="text-sm" style={{ color: 'var(--accent)' }}>✓ تم الموافقة على طلبك - أدخل كلمة المرور الجديدة</p>
                <input type="password" className="input-field" placeholder="كلمة المرور الجديدة"
                  value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
                <input type="password" className="input-field" placeholder="تأكيد كلمة المرور"
                  value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                <button onClick={changePassword} disabled={loading} className="btn-primary w-full">حفظ كلمة المرور الجديدة</button>
              </>
            ) : student?.password_change_requested ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">⏳</div>
                <p className="font-bold">طلبك قيد المراجعة</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text2)' }}>سيتم الرد عليك قريباً</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>لتغيير كلمة المرور يجب الحصول على موافقة الأدمن أولاً</p>
                <button onClick={requestChange} disabled={loading} className="btn-primary">إرسال طلب تغيير كلمة المرور</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
