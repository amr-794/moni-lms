import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function Students() {
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (search) params.set('search', search)
      if (gradeFilter) params.set('grade_id', gradeFilter)
      const { data } = await api.get(`/api/students?${params}`)
      setStudents(data.students || [])
      setTotal(data.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, gradeFilter])
  useEffect(() => { api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {}) }, [])

  const openAdd = () => { setForm({ password: '123456' }); setError(''); setModal('add') }
  const openEdit = (s) => { setForm({ ...s, password: '' }); setError(''); setModal('edit') }
  const openBan = (s) => { setForm({ id: s.id, ban_until: '', ban_reason: '', full_name: s.full_name }); setModal('ban') }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (modal === 'add') await api.post('/api/students', form)
      else if (modal === 'edit') await api.put(`/api/students/${form.id}`, form)
      else if (modal === 'ban') await api.post('/api/online/ban-account', { student_id: form.id, ban_until: form.ban_until || null, ban_reason: form.ban_reason })
      setModal(null); load()
    } catch (err) {
      setError(err.response?.data?.error || 'خطأ')
    } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!window.confirm('حذف الطالب نهائياً؟')) return
    await api.delete(`/api/students/${id}`).catch(() => {})
    load()
  }

  const approvePasswordChange = async (id) => {
    await api.post(`/api/students/${id}/approve-password-change`).catch(() => {})
    load()
  }

  const unban = async (id) => {
    await api.post('/api/online/unban-account', { student_id: id }).catch(() => {})
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AdminLayout title="إدارة الطلاب">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input className="input-field w-56" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field w-48" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">كل الصفوف</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary">+ إضافة طالب</button>
        <span className="text-sm self-center" style={{ color: 'var(--text2)' }}>الإجمالي: {total}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg2)' }}>
              <tr>{['الاسم', 'الكود', 'الهاتف', 'الصف', 'الحالة', 'إجراءات'].map(h => <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--text2)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} className="border-t hover:bg-white/2" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="font-bold">{s.full_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text2)' }}>{s.email}</div>
                    {s.password_change_requested && !s.password_change_approved && (
                      <button onClick={() => approvePasswordChange(s.id)} className="text-xs mt-1 px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,200,0,0.15)', color: '#fcd34d' }}>
                        ✋ موافقة على تغيير كلمة المرور
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--accent)' }}>{s.student_code}</td>
                  <td className="px-4 py-3">{s.phone}</td>
                  <td className="px-4 py-3">{s.grades?.name || '-'}</td>
                  <td className="px-4 py-3">
                    {s.ban_until && new Date(s.ban_until) > new Date()
                      ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>محظور</span>
                      : s.is_active
                        ? <span className="badge" style={{ background: 'rgba(67,233,123,0.1)', color: 'var(--accent)' }}>نشط</span>
                        : <span className="badge" style={{ background: 'rgba(100,100,100,0.2)', color: '#94a3b8' }}>موقوف</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10" title="تعديل"><i className="fas fa-edit"></i></button>
                      {s.ban_until && new Date(s.ban_until) > new Date()
                        ? <button onClick={() => unban(s.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: 'var(--accent)' }} title="رفع الحظر"><i className="fas fa-unlock"></i></button>
                        : <button onClick={() => openBan(s)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }} title="حظر"><i className="fas fa-ban"></i></button>}
                      <button onClick={() => del(s.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }} title="حذف"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <div className="text-center py-10" style={{ color: 'var(--text2)' }}>لا توجد نتائج</div>}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">{modal === 'add' ? 'إضافة طالب' : modal === 'edit' ? 'تعديل بيانات' : 'حظر الطالب'}</h2>
              <button onClick={() => setModal(null)} className="hover:opacity-70 text-xl">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}

            {modal === 'ban' ? (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text2)' }}>حظر: <strong>{form.full_name}</strong></p>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>حتى تاريخ (اتركه فارغ للحظر الدائم)</label>
                  <input type="datetime-local" className="input-field" value={form.ban_until} onChange={e => set('ban_until', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>سبب الحظر</label>
                  <input className="input-field" value={form.ban_reason || ''} onChange={e => set('ban_reason', e.target.value)} placeholder="اكتب السبب..." />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { k: 'full_name', l: 'الاسم الكامل', r: true },
                  { k: 'phone', l: 'الهاتف', r: true },
                  { k: 'parent_phone', l: 'هاتف ولي الأمر', r: true },
                  { k: 'email', l: 'البريد الإلكتروني', t: 'email', r: true },
                  { k: 'password', l: modal === 'add' ? 'كلمة المرور' : 'كلمة مرور جديدة (اتركها فارغة)', t: 'password' },
                ].map(({ k, l, r, t = 'text' }) => (
                  <div key={k}>
                    <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>{l}</label>
                    <input type={t} className="input-field" value={form[k] || ''} onChange={e => set(k, e.target.value)} required={r} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الصف الدراسي</label>
                  <select className="input-field" value={form.grade_id || ''} onChange={e => set('grade_id', e.target.value)}>
                    <option value="">اختر الصف</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                {modal === 'edit' && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    <span style={{ color: 'var(--text2)' }}>الحساب نشط</span>
                  </label>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
