import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../utils/api'

export default function Exams() {
  const { student } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/exams/student${student?.grade_id ? `?grade_id=${student.grade_id}` : ''}`)
      .then(({ data }) => setExams(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const fmt = (d) => d ? new Date(d).toLocaleString('ar-EG', { hour12: true }) : '-'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-6">📝 الامتحانات</h1>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد امتحانات متاحة</div>
        ) : (
          <div className="grid gap-4">
            {exams.map(ex => {
              const submitted = ex.session?.is_submitted
              const hasAccess = ex.has_access
              const now = new Date()
              const started = !ex.available_from || new Date(ex.available_from) <= now
              const notEnded = !ex.available_until || new Date(ex.available_until) >= now
              const canTake = hasAccess && !submitted && started && notEnded && !ex.is_banned

              return (
                <div key={ex.id} className="card flex items-center justify-between gap-4 fade-in">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{ex.title}</h3>
                      {ex.is_free && <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>مجاني</span>}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs flex-wrap" style={{ color: 'var(--text2)' }}>
                      <span>⏱ {ex.duration_minutes} دقيقة</span>
                      <span>🔢 كود: {ex.exam_identifier}</span>
                      {ex.available_from && <span>📅 يبدأ: {fmt(ex.available_from)}</span>}
                      {ex.available_until && <span>⛔ ينتهي: {fmt(ex.available_until)}</span>}
                    </div>
                    {submitted && ex.session && (
                      <div className="mt-2 text-sm">
                        {ex.result_mode === 'instant' && ex.session.is_result_visible
                          ? <span style={{ color: 'var(--accent)' }}>✓ درجتك: {ex.session.score}/{ex.session.total_points}</span>
                          : <span style={{ color: 'var(--text2)' }}>✓ تم التسليم - النتيجة ستظهر لاحقاً</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {ex.is_banned ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>محظور</span>
                      : submitted ? <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>✓ تم التسليم</span>
                      : !hasAccess ? <span className="badge" style={{ background: 'rgba(100,100,200,0.15)', color: '#a5b4fc' }}>🔒 يحتاج كود</span>
                      : !started ? <span className="badge" style={{ background: 'rgba(255,200,0,0.1)', color: '#fcd34d' }}>⏳ لم يبدأ بعد</span>
                      : !notEnded ? <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>⛔ انتهى</span>
                      : <Link to={`/exam/${ex.id}`} className="btn-primary text-sm px-5 py-2">ابدأ الآن</Link>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
