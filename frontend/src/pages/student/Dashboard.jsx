import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../hooks/useAuth.jsx'
import api from '../../utils/api'

export default function Dashboard() {
  const { student } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [codeInput, setCodeInput] = useState('')
  const [codeMsg, setCodeMsg] = useState(null)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('courses')

  useEffect(() => {
    if (student?.grade_id) {
      api.get(`/api/courses?grade_id=${student.grade_id}`).then(({ data }) => setCourses(data)).catch(() => {}).finally(() => setLoading(false))
    } else setLoading(false)
  }, [student])

  const redeemCode = async (type) => {
    if (!codeInput.trim()) return
    setRedeemLoading(true)
    setCodeMsg(null)
    try {
      const { data } = await api.post(`/api/codes/${type}/redeem`, { code: codeInput.trim() })
      setCodeMsg({ type: 'success', text: data.message })
      setCodeInput('')
    } catch (err) {
      setCodeMsg({ type: 'error', text: err.response?.data?.error || 'الكود غير صحيح' })
    } finally { setRedeemLoading(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="card mb-6 flex items-center justify-between fade-in">
          <div>
            <h1 className="text-xl font-black">مرحباً، {student?.full_name} 👋</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>كود طالبك: <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{student?.student_code}</span></p>
          </div>
          <div className="text-right text-sm" style={{ color: 'var(--text2)' }}>
            <p>{student?.grades?.name || 'طالب'}</p>
          </div>
        </div>

        {/* Redeem code */}
        <div className="card mb-6 fade-in">
          <h2 className="font-bold mb-3">🔑 استخدام كود محاضرة أو امتحان</h2>
          <div className="flex gap-2 flex-wrap">
            <input className="input-field flex-1 min-w-[200px]" placeholder="أدخل الكود هنا..."
              value={codeInput} onChange={e => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && redeemCode('lecture')} />
            <button onClick={() => redeemCode('lecture')} disabled={redeemLoading} className="btn-primary px-5">
              {redeemLoading ? '...' : 'محاضرة'}
            </button>
            <button onClick={() => redeemCode('exam')} disabled={redeemLoading} className="btn-secondary px-5">
              {redeemLoading ? '...' : 'امتحان'}
            </button>
          </div>
          {codeMsg && (
            <div className="mt-3 px-3 py-2 rounded-xl text-sm"
              style={{ background: codeMsg.type === 'success' ? 'rgba(67,233,123,0.1)' : 'rgba(239,68,68,0.1)', color: codeMsg.type === 'success' ? 'var(--accent)' : '#f87171' }}>
              {codeMsg.text}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['courses', 'exams'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
              style={{ background: activeTab === t ? 'var(--primary)' : 'var(--card)', color: activeTab === t ? 'white' : 'var(--text2)', border: '1px solid var(--border)' }}>
              {t === 'courses' ? '📚 الكورسات' : '📝 الامتحانات'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div>
          </div>
        ) : activeTab === 'courses' ? (
          courses.length === 0 ? (
            <div className="text-center py-20 text-gray-400">لا توجد كورسات متاحة حالياً</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <div key={course.id} className="card hover:scale-[1.01] transition-all cursor-pointer">
                  {course.cover_url && <img src={course.cover_url} alt={course.name} className="w-full h-40 object-cover rounded-xl mb-4" />}
                  {!course.cover_url && <div className="w-full h-40 rounded-xl mb-4 flex items-center justify-center text-4xl" style={{ background: 'var(--bg2)' }}>📖</div>}
                  <h3 className="font-bold text-lg mb-2">{course.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>{course.playlists?.length || 0} قائمة</p>
                  <div className="mt-4 space-y-2">
                    {(course.playlists || []).filter(p => p.is_active).map(pl => (
                      <Link key={pl.id} to={`/dashboard?playlist=${pl.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-sm transition-all"
                        style={{ border: '1px solid var(--border)' }}>
                        <i className="fas fa-play-circle" style={{ color: 'var(--primary)' }}></i>
                        <span>{pl.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <StudentExamsList gradeId={student?.grade_id} />
        )}
      </div>
    </div>
  )
}

function StudentExamsList({ gradeId }) {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const { Link: Ln } = { Link }

  useEffect(() => {
    api.get(`/api/exams/student${gradeId ? `?grade_id=${gradeId}` : ''}`).then(({ data }) => setExams(data)).catch(() => {}).finally(() => setLoading(false))
  }, [gradeId])

  if (loading) return <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
  if (!exams.length) return <div className="text-center py-10 text-gray-400">لا توجد امتحانات متاحة</div>

  return (
    <div className="grid gap-3">
      {exams.map(ex => (
        <div key={ex.id} className="card flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">{ex.title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
              {ex.duration_minutes} دقيقة · كود: {ex.exam_identifier}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {ex.session?.is_submitted ? (
              <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>✓ تم التسليم</span>
            ) : ex.has_access ? (
              <Link to={`/exam/${ex.id}`} className="btn-primary text-sm px-4 py-2">ابدأ</Link>
            ) : (
              <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>🔒 يحتاج كود</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
