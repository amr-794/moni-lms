import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import VideoPlayer from '../../components/VideoPlayer'
import api from '../../utils/api'

export default function Watch() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExhausted, setShowExhausted] = useState(false)

  useEffect(() => {
    api.get(`/api/lectures/${id}/watch`).then(({ data: d }) => setData(d))
      .catch(err => setError(err.response?.data?.error || 'لا يمكن مشاهدة هذه المحاضرة'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (showExhausted) {
      const t = setTimeout(() => navigate('/dashboard'), 3000)
      return () => clearTimeout(t)
    }
  }, [showExhausted])

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>

  if (error) return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-bold text-lg mb-2">{error}</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4 w-full">العودة للرئيسية</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-sm hover:opacity-70" style={{ color: 'var(--text2)' }}>
          <i className="fas fa-arrow-right"></i> رجوع
        </button>

        <h1 className="text-xl font-black mb-4">{data?.lecture?.title}</h1>

        <VideoPlayer
          lectureId={id}
          videoUrl={data?.lecture?.video_url}
          videoType={data?.lecture?.video_type}
          watchSessionId={data?.watch_session_id}
          onViewsExhausted={() => setShowExhausted(true)}
        />

        {data?.lecture?.notes && (
          <div className="card mt-6">
            <h3 className="font-bold mb-2">📝 ملاحظات</h3>
            <p style={{ color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{data.lecture.notes}</p>
          </div>
        )}
      </div>

      {showExhausted && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="card text-center max-w-sm">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-bold text-lg mb-2">انتهت مشاهداتك!</h2>
            <p style={{ color: 'var(--text2)' }}>سيتم تحويلك لصفحة المحاضرات خلال 3 ثوانٍ...</p>
            <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg2)' }}>
              <div className="h-full rounded-full" style={{ background: 'var(--secondary)', animation: 'progress 3s linear' }}></div>
            </div>
          </div>
          <style>{`@keyframes progress { from { width: 100% } to { width: 0% } }`}</style>
        </div>
      )}
    </div>
  )
}
