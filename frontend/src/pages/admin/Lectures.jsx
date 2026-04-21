// ========== LECTURES ==========
import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function Lectures() {
  const [lectures, setLectures] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [grades, setGrades] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [filterPlaylist, setFilterPlaylist] = useState('')

  const load = () => {
    const params = filterPlaylist ? `?playlist_id=${filterPlaylist}` : ''
    api.get(`/api/lectures${params}`).then(({ data }) => setLectures(data)).catch(() => {})
  }

  useEffect(() => { load() }, [filterPlaylist])
  useEffect(() => {
    api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {})
    api.get('/api/courses').then(({ data }) => {
      const pls = data.flatMap(c => (c.playlists || []).map(p => ({ ...p, course_name: c.name })))
      setPlaylists(pls)
    }).catch(() => {})
  }, [])

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/)
    return match?.[1] || ''
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/api/lectures/${form.id}`, form)
      else await api.post('/api/lectures', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!window.confirm('حذف المحاضرة؟')) return
    await api.delete(`/api/lectures/${id}`).catch(() => {})
    load()
  }

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'video_url' && form.video_type === 'youtube') setPreview(getYouTubeId(v))
  }

  return (
    <AdminLayout title="المحاضرات">
      <div className="flex flex-wrap gap-3 mb-6">
        <select className="input-field w-56" value={filterPlaylist} onChange={e => setFilterPlaylist(e.target.value)}>
          <option value="">كل القوائم</option>
          {playlists.map(p => <option key={p.id} value={p.id}>{p.course_name} - {p.name}</option>)}
        </select>
        <button onClick={() => { setForm({ video_type: 'youtube', is_free: false, view_limit: 3 }); setPreview(''); setError(''); setModal(true) }} className="btn-primary">+ محاضرة جديدة</button>
      </div>

      <div className="grid gap-3">
        {lectures.map(l => (
          <div key={l.id} className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {l.cover_url ? <img src={l.cover_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" /> : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'var(--bg2)' }}>🎬</div>}
              <div>
                <h3 className="font-bold">{l.title}</h3>
                <div className="flex gap-2 mt-1 text-xs flex-wrap" style={{ color: 'var(--text2)' }}>
                  <span>{l.video_type}</span>
                  {l.is_free ? <span style={{ color: 'var(--accent)' }}>مجانية</span> : <span>مشاهدات: {l.view_limit}</span>}
                  {!l.is_active && <span style={{ color: '#f87171' }}>مخفية</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setForm(l); setPreview(l.video_type === 'youtube' ? getYouTubeId(l.video_url) : ''); setError(''); setModal(true) }} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"><i className="fas fa-edit"></i></button>
              <button onClick={() => del(l.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
            </div>
          </div>
        ))}
        {lectures.length === 0 && <div className="text-center py-20" style={{ color: 'var(--text2)' }}>لا توجد محاضرات</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">{form.id ? 'تعديل محاضرة' : 'محاضرة جديدة'}</h2>
              <button onClick={() => setModal(false)} className="text-xl hover:opacity-70">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>عنوان المحاضرة</label>
                <input className="input-field" value={form.title || ''} onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>القائمة</label>
                <select className="input-field" value={form.playlist_id || ''} onChange={e => set('playlist_id', e.target.value)}>
                  <option value="">اختر القائمة</option>
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.course_name} ← {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الصف</label>
                <select className="input-field" value={form.grade_id || ''} onChange={e => set('grade_id', e.target.value)}>
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نوع الفيديو</label>
                <select className="input-field" value={form.video_type || 'youtube'} onChange={e => set('video_type', e.target.value)}>
                  <option value="youtube">YouTube</option>
                  <option value="embed">Embed Code</option>
                  <option value="drive">Google Drive</option>
                  <option value="direct">رابط مباشر</option>
                </select>
              </div>
              {form.video_type === 'embed' ? (
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>Embed Code</label>
                  <textarea className="input-field" rows={4} value={form.embed_code || ''} onChange={e => set('embed_code', e.target.value)} placeholder='<iframe ...></iframe>' />
                </div>
              ) : (
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رابط الفيديو</label>
                  <input className="input-field" value={form.video_url || ''} onChange={e => set('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
              )}

              {/* YouTube Preview */}
              {form.video_type === 'youtube' && preview && (
                <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <iframe src={`https://www.youtube.com/embed/${preview}?rel=0`} className="w-full h-full" frameBorder="0" allowFullScreen title="preview" />
                </div>
              )}

              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رابط الغلاف</label>
                <input className="input-field" value={form.cover_url || ''} onChange={e => set('cover_url', e.target.value)} />
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_free || false} onChange={e => set('is_free', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ color: 'var(--text2)' }}>مجانية</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ color: 'var(--text2)' }}>مفعّلة</span>
                </label>
              </div>
              {!form.is_free && (
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>عدد المشاهدات المسموحة</label>
                  <input type="number" className="input-field" value={form.view_limit || 3} onChange={e => set('view_limit', +e.target.value)} min={1} />
                </div>
              )}
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>ملاحظات (اختياري)</label>
                <textarea className="input-field" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>ترتيب العرض</label>
                <input type="number" className="input-field" value={form.display_order || 0} onChange={e => set('display_order', +e.target.value)} />
              </div>
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
