import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'

export default function TakeExam() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: null, exam: null, questions: [], session: null })
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [exits, setExits] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [forceMsg, setForceMsg] = useState('')
  const saveInterval = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    api.post(`/api/exams/${id}/start`).then(({ data }) => {
      setState({ loading: false, error: null, exam: data.exam, questions: data.questions, session: data.session })
      setAnswers(data.session?.answers || {})
      setTimeLeft(data.session?.time_remaining_seconds || data.exam.duration_minutes * 60)
      setExits(data.session?.exits_count || 0)
    }).catch(err => setState(s => ({ ...s, loading: false, error: err.response?.data?.error || 'خطأ في تحميل الامتحان' })))
  }, [id])

  // Auto-save every 10 seconds
  useEffect(() => {
    if (submitted || state.loading) return
    saveInterval.current = setInterval(() => saveProgress(), 10000)
    return () => clearInterval(saveInterval.current)
  }, [answers, timeLeft, exits, submitted, state.loading])

  // Timer
  useEffect(() => {
    if (state.loading || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        if (t === 3) handleSubmit(true) // auto-submit at 3 seconds
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state.loading, submitted])

  // Detect tab/window blur (exit detection)
  useEffect(() => {
    const handleBlur = () => {
      if (submitted) return
      const newExits = exits + 1
      setExits(newExits)
      api.put(`/api/exams/${id}/session`, { answers, time_remaining_seconds: timeLeft, exits_count: newExits })
        .then(({ data }) => { if (data.force_submit) { setForceMsg(data.message); handleSubmit(true) } })
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [exits, answers, timeLeft, submitted])

  const saveProgress = useCallback(() => {
    if (submitted) return
    api.put(`/api/exams/${id}/session`, { answers, time_remaining_seconds: timeLeft, exits_count: exits }).catch(() => {})
  }, [answers, timeLeft, exits, submitted])

  const handleSubmit = async (forced = false) => {
    if (submitted) return
    clearInterval(saveInterval.current)
    clearInterval(timerRef.current)
    try {
      const { data } = await api.post(`/api/exams/${id}/submit`, { answers, forced })
      setSubmitted(true)
      setResult(data)
    } catch (err) {
      alert(err.response?.data?.error || 'خطأ في التسليم')
    }
  }

  const setAnswer = (qId, val) => setAnswers(a => ({ ...a, [qId]: val }))
  const toggleMultiple = (qId, choiceId) => {
    const cur = answers[qId] || []
    setAnswers(a => ({ ...a, [qId]: cur.includes(choiceId) ? cur.filter(c => c !== choiceId) : [...cur, choiceId] }))
  }

  const fmtTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const allAnswered = state.questions.every(q => answers[q.id])
  const answeredCount = state.questions.filter(q => answers[q.id]).length

  if (state.loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
  if (state.error) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="card text-center max-w-sm"><div className="text-4xl mb-4">⚠️</div><p className="font-bold mb-4">{state.error}</p><button onClick={() => navigate('/exams')} className="btn-primary w-full">رجوع للامتحانات</button></div></div>

  if (submitted && result) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="card text-center max-w-md w-full fade-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black mb-2">تم تسليم الامتحان!</h2>
        {result.is_result_visible ? (
          <>
            <div className="my-6 p-6 rounded-2xl" style={{ background: 'var(--bg2)' }}>
              <div className="text-4xl font-black mb-1" style={{ color: 'var(--accent)' }}>{result.percentage}%</div>
              <div className="text-lg" style={{ color: 'var(--text2)' }}>{result.score} من {result.total_points}</div>
            </div>
            {result.submission_code && (
              <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(67,233,123,0.1)', border: '1px solid rgba(67,233,123,0.2)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>كود التسليم</p>
                <p className="font-mono font-black text-xl" style={{ color: 'var(--accent)' }}>{result.submission_code}</p>
              </div>
            )}
          </>
        ) : (
          <p className="my-6" style={{ color: 'var(--text2)' }}>سيتم إعلان النتيجة لاحقاً</p>
        )}
        <button onClick={() => navigate('/exams')} className="btn-primary w-full">العودة للامتحانات</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="font-black text-base">{state.exam?.title}</h1>
          <p className="text-xs" style={{ color: 'var(--text2)' }}>{answeredCount}/{state.questions.length} سؤال</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-xl font-black tabular-nums ${timeLeft < 120 ? 'text-red-400' : ''}`} style={{ color: timeLeft < 120 ? '#f87171' : 'var(--accent)' }}>
              {fmtTime(timeLeft)}
            </div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>الوقت المتبقي</div>
          </div>
          {state.exam?.max_exits && (
            <div className="text-center">
              <div className="text-xl font-black" style={{ color: 'var(--secondary)' }}>{exits}/{state.exam.max_exits}</div>
              <div className="text-xs" style={{ color: 'var(--text2)' }}>خروج</div>
            </div>
          )}
        </div>
      </div>

      {forceMsg && <div className="bg-red-500/20 text-red-300 text-center py-2 text-sm">{forceMsg}</div>}

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {state.questions.map((q, qi) => (
          <div key={q.id} className="card fade-in">
            <div className="flex gap-3 mb-4">
              <span className="font-black text-lg" style={{ color: 'var(--primary)' }}>س{qi + 1}</span>
              <div className="flex-1">
                <p className="font-semibold leading-relaxed">{q.question_text}</p>
                {q.image_url && <img src={q.image_url} alt="" className="mt-3 rounded-xl max-h-48 object-contain" />}
              </div>
              <span className="text-xs" style={{ color: 'var(--text2)' }}>{q.points} درجة</span>
            </div>

            {q.question_type === 'single' && (
              <div className="space-y-2">
                {q.choices.map(c => (
                  <button key={c.id} onClick={() => setAnswer(q.id, c.id)}
                    className="w-full text-right px-4 py-3 rounded-xl transition-all text-sm"
                    style={{ background: answers[q.id] === c.id ? 'rgba(108,99,255,0.2)' : 'var(--bg2)', border: `1px solid ${answers[q.id] === c.id ? 'var(--primary)' : 'var(--border)'}` }}>
                    {c.choice_text}
                  </button>
                ))}
              </div>
            )}

            {q.question_type === 'multiple' && (
              <div className="space-y-2">
                <p className="text-xs mb-2" style={{ color: 'var(--text2)' }}>اختر أكثر من إجابة</p>
                {q.choices.map(c => {
                  const checked = (answers[q.id] || []).includes(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleMultiple(q.id, c.id)}
                      className="w-full text-right px-4 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
                      style={{ background: checked ? 'rgba(108,99,255,0.2)' : 'var(--bg2)', border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}` }}>
                      <span className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center" style={{ borderColor: checked ? 'var(--primary)' : 'var(--border)', background: checked ? 'var(--primary)' : 'transparent' }}>
                        {checked && <i className="fas fa-check text-white text-xs"></i>}
                      </span>
                      {c.choice_text}
                    </button>
                  )
                })}
              </div>
            )}

            {q.question_type === 'matrix' && (() => {
              const rows = [...new Set(q.choices.map(c => c.matrix_row))].sort()
              const cols = q.choices.filter(c => c.matrix_row === rows[0])
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-right" style={{ borderBottom: '1px solid var(--border)' }}>العبارة</th>
                        {cols.map(c => <th key={c.id} className="p-2 text-center" style={{ borderBottom: '1px solid var(--border)' }}>{c.choice_text}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => {
                        const rowChoices = q.choices.filter(c => c.matrix_row === row)
                        return (
                          <tr key={row}>
                            <td className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>عبارة {row}</td>
                            {rowChoices.map(c => (
                              <td key={c.id} className="p-2 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <button onClick={() => setAnswers(a => ({ ...a, [q.id]: { ...(a[q.id] || {}), [row]: c.id } }))}
                                  className="w-5 h-5 rounded-full border-2 transition-all mx-auto block"
                                  style={{ borderColor: answers[q.id]?.[row] === c.id ? 'var(--primary)' : 'var(--border)', background: answers[q.id]?.[row] === c.id ? 'var(--primary)' : 'transparent' }} />
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        ))}

        {/* Submit */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: 'var(--text2)' }}>أجبت على {answeredCount} من {state.questions.length} سؤال</span>
            {allAnswered && <span className="badge" style={{ background: 'rgba(67,233,123,0.15)', color: 'var(--accent)' }}>✓ أجبت على الكل</span>}
          </div>
          <button onClick={() => { if (window.confirm('هل أنت متأكد من تسليم الامتحان؟')) handleSubmit(false) }}
            className="btn-primary w-full py-3 text-base" style={{ opacity: answeredCount === 0 ? 0.5 : 1 }}>
            تسليم الامتحان
          </button>
        </div>
      </div>
    </div>
  )
}
