import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

// ========== LECTURE CODES ==========
export function LectureCodes() {
  const [codes, setCodes] = useState([])
  const [lectures, setLectures] = useState([])
  const [form, setForm] = useState({ count: 10, view_limit: 3 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filterLecture, setFilterLecture] = useState('')

  const load = () => {
    const params = filterLecture ? `?lecture_id=${filterLecture}` : ''
    api.get(`/api/codes/lecture${params}`).then(({ data }) => setCodes(data)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filterLecture])
  useEffect(() => { api.get('/api/lectures').then(({ data }) => setLectures(data)).catch(() => {}) }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      await api.post('/api/codes/lecture/generate', form)
      load()
    } catch (err) { alert(err.response?.data?.error || 'خطأ') } finally { setGenerating(false) }
  }

  const del = async (id) => {
    await api.delete(`/api/codes/lecture/${id}`).catch(() => {})
    load()
  }

  const copy = (text) => navigator.clipboard.writeText(text).then(() => {})

  return (
    <AdminLayout title="أكواد المحاضرات">
      <div className="card mb-6">
        <h3 className="font-bold mb-3">⚡ توليد أكواد جديدة</h3>
        <div className="flex flex-wrap gap-3">
          <select className="input-field flex-1 min-w-[200px]" value={form.lecture_id || ''} onChange={e => setForm(f => ({ ...f, lecture_id: e.target.value }))}>
            <option value="">اختر المحاضرة</option>
            {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <input type="number" className="input-field w-24" placeholder="عدد" min={1} max={500} value={form.count} onChange={e => setForm(f => ({ ...f, count: +e.target.value }))} />
          <input className="input-field w-28" placeholder="بادئة (اختياري)" value={form.prefix || ''} onChange={e => setForm(f => ({ ...f, prefix: e.target.value }))} />
          <button onClick={generate} disabled={generating || !form.lecture_id} className="btn-primary px-6">{generating ? 'جاري التوليد...' : 'توليد'}</button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="input-field w-56" value={filterLecture} onChange={e => setFilterLecture(e.target.value)}>
          <option value="">كل المحاضرات</option>
          {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg2)' }}>
            <tr>{['الكود', 'المحاضرة', 'الحالة', 'استُخدم بواسطة', 'إجراء'].map(h => <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--text2)' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3">
                  <button onClick={() => copy(c.code)} className="font-mono font-bold hover:opacity-70" style={{ color: 'var(--accent)' }}>{c.code}</button>
                </td>
                <td className="px-4 py-3 text-xs">{c.lectures?.title}</td>
                <td className="px-4 py-3">
                  {c.is_used ? <span className="badge" style={{ background: 'rgba(100,100,100,0.2)', color: '#94a3b8' }}>مستخدم</span>
                    : <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>متاح</span>}
                </td>
                <td className="px-4 py-3 text-xs">{c.students?.full_name || '-'}</td>
                <td className="px-4 py-3"><button onClick={() => del(c.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {codes.length === 0 && <div className="text-center py-10" style={{ color: 'var(--text2)' }}>لا توجد أكواد</div>}
      </div>
    </AdminLayout>
  )
}

// ========== EXAM CODES ==========
export function ExamCodes() {
  const [codes, setCodes] = useState([])
  const [exams, setExams] = useState([])
  const [form, setForm] = useState({ count: 10 })
  const [generating, setGenerating] = useState(false)

  const load = () => api.get('/api/codes/exam').then(({ data }) => setCodes(data)).catch(() => {})
  useEffect(() => { load(); api.get('/api/exams').then(({ data }) => setExams(data)).catch(() => {}) }, [])

  const generate = async () => {
    setGenerating(true)
    try { await api.post('/api/codes/exam/generate', form); load() }
    catch (err) { alert(err.response?.data?.error || 'خطأ') } finally { setGenerating(false) }
  }

  return (
    <AdminLayout title="أكواد الامتحانات">
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <select className="input-field flex-1 min-w-[200px]" value={form.exam_id || ''} onChange={e => setForm(f => ({ ...f, exam_id: e.target.value }))}>
            <option value="">اختر الامتحان</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <input type="number" className="input-field w-24" placeholder="عدد" min={1} max={500} value={form.count} onChange={e => setForm(f => ({ ...f, count: +e.target.value }))} />
          <button onClick={generate} disabled={generating || !form.exam_id} className="btn-primary px-6">{generating ? 'جاري...' : 'توليد'}</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg2)' }}><tr>{['الكود', 'الامتحان', 'الحالة', 'استُخدم بواسطة', 'حذف'].map(h => <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--text2)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--accent)' }}>{c.code}</td>
                <td className="px-4 py-3 text-xs">{c.exams?.title}</td>
                <td className="px-4 py-3">{c.is_used ? <span className="badge" style={{ background: 'rgba(100,100,100,0.2)', color: '#94a3b8' }}>مستخدم</span> : <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>متاح</span>}</td>
                <td className="px-4 py-3 text-xs">{c.students?.full_name || '-'}</td>
                <td className="px-4 py-3"><button onClick={async () => { await api.delete(`/api/codes/exam/${c.id}`).catch(() => {}); load() }} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {codes.length === 0 && <div className="text-center py-10" style={{ color: 'var(--text2)' }}>لا توجد أكواد</div>}
      </div>
    </AdminLayout>
  )
}

// ========== RESULTS ==========
export function Results() {
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    api.get('/api/results').then(({ data }) => { setResults(data.results || []); setTotal(data.total) }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fmt = d => new Date(d).toLocaleString('ar-EG', { hour12: true })

  const sendToWhatsApp = (r) => {
    const txt = encodeURIComponent(`نتيجة ${r.students?.full_name}\nالامتحان: ${r.exams?.title}\nالدرجة: ${r.score}/${r.total_points} (${r.total_points > 0 ? ((r.score/r.total_points)*100).toFixed(1) : 0}%)`)
    window.open(`https://wa.me/${r.students?.phone?.replace(/^0/, '2')}?text=${txt}`, '_blank')
  }

  return (
    <AdminLayout title="نتائج الطلاب">
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg2)' }}><tr>{['الطالب', 'الامتحان', 'الدرجة', 'تاريخ التسليم', 'إجراءات'].map(h => <th key={h} className="px-4 py-3 text-right font-bold" style={{ color: 'var(--text2)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} className="border-t hover:bg-white/2" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3"><div className="font-bold">{r.students?.full_name}</div><div className="text-xs" style={{ color: 'var(--text2)' }}>{r.students?.grades?.name}</div></td>
                <td className="px-4 py-3">{r.exams?.title}</td>
                <td className="px-4 py-3">
                  <span className="font-black" style={{ color: r.total_points > 0 && (r.score/r.total_points) >= 0.5 ? 'var(--accent)' : '#f87171' }}>
                    {r.score}/{r.total_points}
                  </span>
                  <span className="text-xs mr-1" style={{ color: 'var(--text2)' }}>({r.total_points > 0 ? ((r.score/r.total_points)*100).toFixed(0) : 0}%)</span>
                </td>
                <td className="px-4 py-3 text-xs">{fmt(r.submitted_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => sendToWhatsApp(r)} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(37,211,102,0.15)', color: '#25d366' }} title="واتساب"><i className="fab fa-whatsapp"></i></button>
                    <button onClick={() => api.put(`/api/results/${r.id}/visibility`, { is_result_visible: true }).then(() => alert('تم إظهار النتيجة'))} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10" title="إظهار النتيجة"><i className="fas fa-eye"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && !loading && <div className="text-center py-10" style={{ color: 'var(--text2)' }}>لا توجد نتائج</div>}
      </div>
    </AdminLayout>
  )
}

// ========== ONLINE USERS ==========
export function OnlineUsers() {
  const [users, setUsers] = useState([])
  const load = () => api.get('/api/online').then(({ data }) => setUsers(data)).catch(() => {})
  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [])

  return (
    <AdminLayout title="المتصلون الآن">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#22c55e' }}></span>
        <span className="font-bold">{users.length} متصل الآن</span>
        <button onClick={load} className="text-xs px-3 py-1 rounded-xl mr-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>تحديث</button>
      </div>
      <div className="grid gap-3">
        {users.map(u => (
          <div key={u.student_id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--primary)' }}>{u.students?.full_name?.[0]}</div>
              <div>
                <p className="font-bold">{u.students?.full_name}</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>{u.current_page} · {u.device_type}</p>
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>{new Date(u.last_ping).toLocaleTimeString('ar-EG')}</div>
          </div>
        ))}
        {users.length === 0 && <div className="text-center py-20" style={{ color: 'var(--text2)' }}>لا يوجد أحد متصل الآن</div>}
      </div>
    </AdminLayout>
  )
}

// ========== NOTIFICATIONS ==========
export function AdminNotifications() {
  const [notifs, setNotifs] = useState([])
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [form, setForm] = useState({ type: 'global', body: '' })
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => api.get('/api/notifications/admin/all').then(({ data }) => setNotifs(data)).catch(() => {})
  useEffect(() => {
    load()
    api.get('/api/students?limit=500').then(({ data }) => setStudents(data.students || [])).catch(() => {})
    api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {})
  }, [])

  const send = async (e) => {
    e.preventDefault()
    setSending(true); setMsg(null)
    try {
      await api.post('/api/notifications', form)
      setMsg({ type: 'success', text: 'تم إرسال الإشعار' })
      setForm({ type: 'global', body: '' })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'خطأ' }) } finally { setSending(false) }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AdminLayout title="الإشعارات">
      <div className="card mb-6">
        <h3 className="font-bold mb-4">📨 إرسال إشعار</h3>
        <form onSubmit={send} className="space-y-3">
          {msg && <div className="px-3 py-2 rounded-xl text-sm" style={{ background: msg.type === 'success' ? 'rgba(67,233,123,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? 'var(--accent)' : '#f87171' }}>{msg.text}</div>}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نوع الإشعار</label>
            <select className="input-field" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="global">عام (لكل الطلاب)</option>
              <option value="personal">شخصي</option>
              <option value="banner">بانر</option>
            </select>
          </div>
          {form.type === 'personal' && (
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>اختر الطالب</label>
              <select className="input-field" value={form.target_student_id || ''} onChange={e => set('target_student_id', e.target.value)} required>
                <option value="">اختر طالب</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} - {s.student_code}</option>)}
              </select>
            </div>
          )}
          {form.type === 'global' && (
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>تصفية بالصف (اختياري)</label>
              <select className="input-field" value={form.grade_id || ''} onChange={e => set('grade_id', e.target.value)}>
                <option value="">كل الصفوف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>العنوان (اختياري)</label><input className="input-field" value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
          <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نص الإشعار</label><textarea className="input-field" rows={3} value={form.body} onChange={e => set('body', e.target.value)} required /></div>
          <button type="submit" disabled={sending} className="btn-primary">{sending ? 'جاري الإرسال...' : 'إرسال'}</button>
        </form>
      </div>

      <div className="grid gap-3">
        {notifs.map(n => (
          <div key={n.id} className="card flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{n.type === 'banner' ? '📢' : n.type === 'global' ? '🌐' : '💌'}</span>
                {n.title && <span className="font-bold text-sm">{n.title}</span>}
                <span className="badge text-xs" style={{ background: 'var(--bg2)', color: 'var(--text2)' }}>{n.type}</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{n.body}</p>
              {n.students && <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>→ {n.students.full_name}</p>}
            </div>
            <button onClick={async () => { await api.delete(`/api/notifications/${n.id}`).catch(() => {}); load() }} className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}

// ========== ADMINS ==========
export function AdminAdmins() {
  const [admins, setAdmins] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get('/api/admins').then(({ data }) => setAdmins(data)).catch(() => {})
  useEffect(() => { load() }, [])

  const defaultPerms = { manage_students: true, manage_courses: true, manage_exams: true, manage_codes: true, manage_admins: false, manage_settings: false, view_results: true, manage_notifications: true, manage_bans: true }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/api/admins/${form.id}`, form)
      else await api.post('/api/admins', { ...form, permissions: form.permissions || defaultPerms })
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!window.confirm('حذف الأدمن؟')) return
    await api.delete(`/api/admins/${id}`).catch(() => {})
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setPerm = (k, v) => setForm(f => ({ ...f, permissions: { ...(f.permissions || defaultPerms), [k]: v } }))

  return (
    <AdminLayout title="إدارة الأدمنز">
      <div className="flex justify-end mb-6">
        <button onClick={() => { setForm({ permissions: defaultPerms }); setError(''); setModal(true) }} className="btn-primary">+ أدمن جديد</button>
      </div>
      <div className="grid gap-3">
        {admins.map(a => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">{a.display_name || a.username}</span>
                {a.is_super_admin && <span className="badge" style={{ background: 'rgba(255,200,0,0.15)', color: '#fcd34d' }}>سوبر أدمن</span>}
                {!a.is_active && <span className="badge" style={{ background: 'rgba(100,100,100,0.2)', color: '#94a3b8' }}>موقوف</span>}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>@{a.username}</p>
            </div>
            {!a.is_super_admin && (
              <div className="flex gap-2">
                <button onClick={() => { setForm(a); setError(''); setModal(true) }} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"><i className="fas fa-edit"></i></button>
                <button onClick={() => del(a.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">{form.id ? 'تعديل أدمن' : 'أدمن جديد'}</h2>
              <button onClick={() => setModal(false)} className="text-xl hover:opacity-70">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>اسم المستخدم</label><input className="input-field" value={form.username || ''} onChange={e => set('username', e.target.value)} required /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الاسم المعروض</label><input className="input-field" value={form.display_name || ''} onChange={e => set('display_name', e.target.value)} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>{form.id ? 'كلمة مرور جديدة (اتركها فارغة)' : 'كلمة المرور'}</label><input type="password" className="input-field" value={form.password || ''} onChange={e => set('password', e.target.value)} /></div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text2)' }}>الصلاحيات</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(defaultPerms).map(k => (
                    <label key={k} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={(form.permissions || defaultPerms)[k] || false} onChange={e => setPerm(k, e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ color: 'var(--text2)' }}>{k.replace('manage_', 'إدارة ').replace('view_', 'عرض ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--text2)' }}>حساب نشط</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

// ========== BANS ==========
export function Bans() {
  const [bans, setBans] = useState([])
  const [students, setStudents] = useState([])
  const [lectures, setLectures] = useState([])
  const [exams, setExams] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ content_type: 'lecture' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/api/online/bans').then(({ data }) => setBans(data)).catch(() => {})
  useEffect(() => {
    load()
    api.get('/api/students?limit=500').then(({ data }) => setStudents(data.students || [])).catch(() => {})
    api.get('/api/lectures').then(({ data }) => setLectures(data)).catch(() => {})
    api.get('/api/exams').then(({ data }) => setExams(data)).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try { await api.post('/api/online/bans', form); setModal(false); load() }
    catch (err) { alert(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const lift = async (id) => {
    await api.delete(`/api/online/bans/${id}`).catch(() => {})
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AdminLayout title="الحظر">
      <div className="flex justify-end mb-6">
        <button onClick={() => { setForm({ content_type: 'lecture' }); setModal(true) }} className="btn-primary">+ حظر محتوى</button>
      </div>
      <div className="grid gap-3">
        {bans.map(b => (
          <div key={b.id} className="card flex items-center justify-between">
            <div>
              <p className="font-bold">{b.students?.full_name}</p>
              <p className="text-xs mt-1" style={{ color: '#f87171' }}>محظور من: {b.content_type === 'lecture' ? 'محاضرة' : 'امتحان'}</p>
              {b.reason && <p className="text-xs" style={{ color: 'var(--text2)' }}>{b.reason}</p>}
            </div>
            <button onClick={() => lift(b.id)} className="text-xs px-3 py-1 rounded-xl" style={{ background: 'rgba(67,233,123,0.1)', color: 'var(--accent)' }}>رفع الحظر</button>
          </div>
        ))}
        {bans.length === 0 && <div className="text-center py-20" style={{ color: 'var(--text2)' }}>لا توجد حظر فعّالة</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4"><h2 className="font-black">حظر محتوى</h2><button onClick={() => setModal(false)} className="text-xl">✕</button></div>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الطالب</label><select className="input-field" value={form.student_id || ''} onChange={e => set('student_id', e.target.value)}><option value="">اختر طالب</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نوع المحتوى</label><select className="input-field" value={form.content_type} onChange={e => set('content_type', e.target.value)}><option value="lecture">محاضرة</option><option value="exam">امتحان</option></select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>المحتوى</label><select className="input-field" value={form.content_id || ''} onChange={e => set('content_id', e.target.value)}><option value="">اختر</option>{form.content_type === 'lecture' ? lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>) : exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>السبب</label><input className="input-field" value={form.reason || ''} onChange={e => set('reason', e.target.value)} /></div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'حفظ'}</button><button onClick={() => setModal(false)} className="btn-secondary flex-1">إلغاء</button></div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
