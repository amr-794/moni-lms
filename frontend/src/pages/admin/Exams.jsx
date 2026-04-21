import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function Exams() {
  const [exams, setExams] = useState([])
  const [grades, setGrades] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [modal, setModal] = useState(false)
  const [qModal, setQModal] = useState(null) // exam to manage questions
  const [form, setForm] = useState({})
  const [qForm, setQForm] = useState({ question_type: 'single', points: 1, choices: [{ choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])

  const load = () => api.get('/api/exams').then(({ data }) => setExams(data)).catch(() => {})
  useEffect(() => {
    load()
    api.get('/api/grades').then(({ data }) => setGrades(data)).catch(() => {})
    api.get('/api/courses').then(({ data }) => setPlaylists(data.flatMap(c => (c.playlists || []).map(p => ({ ...p, course_name: c.name }))))).catch(() => {})
  }, [])

  const loadQuestions = async (examId) => {
    const { data } = await api.get(`/api/exams/${examId}`)
    setQuestions(data.questions || [])
  }

  const saveExam = async () => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/api/exams/${form.id}`, form)
      else await api.post('/api/exams', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const saveQuestion = async () => {
    if (!qModal) return
    setSaving(true); setError('')
    try {
      if (qForm.id) await api.put(`/api/exams/questions/${qForm.id}`, qForm)
      else await api.post(`/api/exams/${qModal}/questions`, qForm)
      await loadQuestions(qModal)
      setQForm({ question_type: 'single', points: 1, choices: [{ choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }] })
    } catch (err) { setError(err.response?.data?.error || 'خطأ') } finally { setSaving(false) }
  }

  const delQuestion = async (qId) => {
    await api.delete(`/api/exams/questions/${qId}`).catch(() => {})
    loadQuestions(qModal)
  }

  const del = async (id) => {
    if (!window.confirm('حذف الامتحان؟')) return
    await api.delete(`/api/exams/${id}`).catch(() => {})
    load()
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setQ = (k, v) => setQForm(f => ({ ...f, [k]: v }))
  const setChoice = (i, k, v) => setQForm(f => ({ ...f, choices: f.choices.map((c, ci) => ci === i ? { ...c, [k]: v } : (k === 'is_correct' && f.question_type === 'single' ? { ...c, is_correct: false } : c)) }))
  const addChoice = () => setQForm(f => ({ ...f, choices: [...f.choices, { choice_text: '', is_correct: false }] }))

  return (
    <AdminLayout title="الامتحانات">
      <div className="flex justify-between mb-6">
        <span className="text-sm self-center" style={{ color: 'var(--text2)' }}>{exams.length} امتحان</span>
        <button onClick={() => { setForm({ duration_minutes: 60, max_exits: 3, extra_minutes: 10, result_mode: 'instant' }); setError(''); setModal(true) }} className="btn-primary">+ امتحان جديد</button>
      </div>

      <div className="grid gap-3">
        {exams.map(ex => (
          <div key={ex.id} className="card flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">{ex.title}</h3>
              <div className="text-xs mt-1 flex gap-3 flex-wrap" style={{ color: 'var(--text2)' }}>
                <span>⏱ {ex.duration_minutes} د</span>
                <span>🔢 {ex.exam_identifier}</span>
                {ex.grades && <span>{ex.grades.name}</span>}
                {ex.is_free && <span style={{ color: 'var(--accent)' }}>مجاني</span>}
                {ex.is_hidden && <span style={{ color: '#f87171' }}>مخفي</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={async () => { setQModal(ex.id); await loadQuestions(ex.id) }} className="text-xs px-3 py-1 rounded-xl" style={{ background: 'rgba(108,99,255,0.15)', color: 'var(--primary)' }}>الأسئلة</button>
              <button onClick={() => { setForm(ex); setError(''); setModal(true) }} className="text-xs px-2 py-1 rounded-lg hover:bg-white/10"><i className="fas fa-edit"></i></button>
              <button onClick={() => del(ex.id)} className="text-xs px-2 py-1 rounded-lg" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
            </div>
          </div>
        ))}
        {exams.length === 0 && <div className="text-center py-20" style={{ color: 'var(--text2)' }}>لا توجد امتحانات</div>}
      </div>

      {/* Exam Form Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">{form.id ? 'تعديل امتحان' : 'امتحان جديد'}</h2>
              <button onClick={() => setModal(false)} className="text-xl hover:opacity-70">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}
            <div className="space-y-3">
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>العنوان</label><input className="input-field" value={form.title || ''} onChange={e => set('title', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>المدة (دقيقة)</label><input type="number" className="input-field" value={form.duration_minutes || 60} onChange={e => set('duration_minutes', +e.target.value)} /></div>
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>وقت إضافي</label><input type="number" className="input-field" value={form.extra_minutes || 10} onChange={e => set('extra_minutes', +e.target.value)} /></div>
              </div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>حد الخروج</label><input type="number" className="input-field" value={form.max_exits || 3} onChange={e => set('max_exits', +e.target.value)} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الصف</label><select className="input-field" value={form.grade_id || ''} onChange={e => set('grade_id', e.target.value)}><option value="">اختر الصف</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>القائمة (اختياري)</label><select className="input-field" value={form.playlist_id || ''} onChange={e => set('playlist_id', e.target.value)}><option value="">بدون قائمة</option>{playlists.map(p => <option key={p.id} value={p.id}>{p.course_name} ← {p.name}</option>)}</select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>طريقة إظهار النتيجة</label><select className="input-field" value={form.result_mode || 'instant'} onChange={e => set('result_mode', e.target.value)}><option value="instant">فورية</option><option value="scheduled">في وقت محدد</option></select></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_free || false} onChange={e => set('is_free', e.target.checked)} style={{ accentColor: 'var(--primary)' }} /><span style={{ color: 'var(--text2)' }}>مجاني</span></label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: 'var(--primary)' }} /><span style={{ color: 'var(--text2)' }}>مفعّل</span></label>
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_hidden || false} onChange={e => set('is_hidden', e.target.checked)} style={{ accentColor: 'var(--primary)' }} /><span style={{ color: 'var(--text2)' }}>مخفي</span></label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>يبدأ من</label><input type="datetime-local" className="input-field" value={form.available_from?.slice(0, 16) || ''} onChange={e => set('available_from', e.target.value)} /></div>
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>ينتهي في</label><input type="datetime-local" className="input-field" value={form.available_until?.slice(0, 16) || ''} onChange={e => set('available_until', e.target.value)} /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={saveExam} disabled={saving} className="btn-primary flex-1">{saving ? '...' : 'حفظ'}</button>
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {qModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">إدارة الأسئلة</h2>
              <button onClick={() => { setQModal(null); setError('') }} className="text-xl hover:opacity-70">✕</button>
            </div>
            {error && <div className="mb-3 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}

            {/* Existing questions */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {questions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg2)' }}>
                  <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>س{i + 1}</span>
                  <div className="flex-1 text-sm">{q.question_text}</div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setQForm({ ...q, choices: q.choices || [] }) }} className="text-xs px-2 py-1 rounded hover:bg-white/10"><i className="fas fa-edit"></i></button>
                    <button onClick={() => delQuestion(q.id)} className="text-xs px-2 py-1 rounded" style={{ color: '#f87171' }}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && <p className="text-center text-sm py-4" style={{ color: 'var(--text2)' }}>لا توجد أسئلة بعد</p>}
            </div>

            {/* Add/edit question form */}
            <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-bold text-sm">{qForm.id ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</h3>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نص السؤال</label><textarea className="input-field" rows={2} value={qForm.question_text || ''} onChange={e => setQ('question_text', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نوع السؤال</label>
                  <select className="input-field" value={qForm.question_type} onChange={e => setQ('question_type', e.target.value)}>
                    <option value="single">إجابة واحدة</option>
                    <option value="multiple">متعدد الإجابات</option>
                    <option value="matrix">مصفوفة</option>
                  </select>
                </div>
                <div><label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>الدرجة</label><input type="number" className="input-field" value={qForm.points || 1} onChange={e => setQ('points', +e.target.value)} min={1} /></div>
              </div>
              <div>
                <label className="block text-sm mb-2" style={{ color: 'var(--text2)' }}>الخيارات</label>
                <div className="space-y-2">
                  {(qForm.choices || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type={qForm.question_type === 'multiple' ? 'checkbox' : 'radio'} name="correct" checked={c.is_correct || false}
                        onChange={e => setChoice(i, 'is_correct', e.target.checked)} style={{ accentColor: 'var(--primary)', flexShrink: 0 }} />
                      <input className="input-field flex-1" placeholder={`خيار ${i + 1}`} value={c.choice_text || ''} onChange={e => setChoice(i, 'choice_text', e.target.value)} />
                      {qForm.question_type === 'matrix' && <input type="number" className="input-field w-16" placeholder="صف" value={c.matrix_row || i + 1} onChange={e => setChoice(i, 'matrix_row', +e.target.value)} />}
                    </div>
                  ))}
                </div>
                <button onClick={addChoice} className="text-xs mt-2 px-3 py-1 rounded-xl" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)' }}>+ خيار</button>
              </div>
              <button onClick={saveQuestion} disabled={saving} className="btn-primary w-full">{saving ? '...' : (qForm.id ? 'تحديث السؤال' : 'إضافة السؤال')}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
