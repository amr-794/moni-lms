import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [grades, setGrades] = useState([])
  const [modal, setModal] = useState(null) // 'course' | 'playlist'
  const [form, setForm] = useState({})
  const [selected, setSelected] = useState(null) // selected course for playlists
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get('/api/courses?admin=1').then(({ data }) => setCourses(data)).catch(() => {})
  useEffect(() => { load(); api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {}) }, [])

  const saveCourse = async () => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/api/courses/${form.id}`, form)
      else await api.post('/api/courses', form)
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const savePlaylist = async () => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/api/courses/playlists/${form.id}`, form)
      else await api.post(`/api/courses/${selected.id}/playlists`, form)
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const del = async (id, type) => {
    if (!window.confirm('حذف؟')) return
    if (type === 'course') await api.delete(`/api/courses/${id}`).catch(() => {})
    else await api.delete(`/api/courses/playlists/${id}`).catch(() => {})
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AdminLayout title="الكورسات والقوائم">
      <div className="flex justify-between mb-6">
        <h2 className="font-bold">جميع الكورسات</h2>
        <button onClick={() => { setForm({}); setError(''); setModal('course') }} className="btn-primary">+ كورس جديد</button>
      </div>

      <div className="grid gap-4">
        {courses.map(course => (
          <div key={course.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {course.cover_url ? <img src={course.cover_url} className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'var(--bg2)' }}>📖</div>}
                <div>
                  <h3 className="font-bold">{course.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--text2)' }}>{course.grades?.name} · {course.playlists?.length || 0} قائمة</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelected(course); setForm({}); setError(''); setModal('playlist') }} className="text-xs px-3 py-1 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>+ قائمة</button>
                <button onClick={() => { setForm(course); setError(''); setModal('course') }} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"><i className="fas fa-edit"></i></button>
                <button onClick={() => del(course.id, 'course')} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
              </div>
            </div>
            {course.playlists?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {course.playlists.map(pl => (
                  <div key={pl.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-list-ul text-xs" style={{ color: 'var(--primary)' }}></i>
                      <span>{pl.name}</span>
                      {!pl.is_active && <span className="badge text-xs" style={{ background: 'rgba(100,100,100,0.2)', color: '#94a3b8' }}>مخفية</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setSelected(course); setForm(pl); setError(''); setModal('playlist') }} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => del(pl.id, 'playlist')} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {courses.length === 0 && <div className="text-center py-20" style={{ color: 'var(--text2)' }}>لا توجد كورسات بعد</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">{modal === 'course' ? (form.id ? 'تعديل كورس' : 'كورس جديد') : (form.id ? 'تعديل قائمة' : 'قائمة جديدة')}</h2>
              <button onClick={() => setModal(null)} className="text-xl hover:opacity-70">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الاسم</label>
                <input className="input-field" value={form.name || ''} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رابط الغلاف (اختياري)</label>
                <input className="input-field" value={form.cover_url || ''} onChange={e => set('cover_url', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الصف الدراسي</label>
                <select className="input-field" value={form.grade_id || ''} onChange={e => set('grade_id', e.target.value)}>
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>ترتيب العرض</label>
                <input type="number" className="input-field" value={form.display_order || 0} onChange={e => set('display_order', +e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                <span style={{ color: 'var(--text2)' }}>مفعّل</span>
              </label>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={modal === 'course' ? saveCourse : savePlaylist} disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
