import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import api from '../utils/api'

export default function VideoPlayer({ lectureId, videoUrl, videoType, watchSessionId, viewLimit, onViewsExhausted }) {
  const { student } = useAuth()
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const [viewCounted, setViewCounted] = useState(false)
  const [bgTimerStarted, setBgTimerStarted] = useState(false)
  const viewTimerRef = useRef(null)
  const bgTimerRef = useRef(null)

  const getYouTubeId = (url) => {
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/)
    return match?.[1] || url
  }

  useEffect(() => {
    if (!watchSessionId) return

    // 15-second view counter
    viewTimerRef.current = setTimeout(async () => {
      if (!viewCounted) {
        try {
          const res = await api.post(`/api/lectures/${lectureId}/view-count`, { watch_session_id: watchSessionId })
          setViewCounted(true)
          if (res.data.views_remaining === 0) {
            onViewsExhausted?.()
          }
        } catch {}
      }
    }, 15000)

    // 3-hour background timer
    bgTimerRef.current = setTimeout(async () => {
      if (!bgTimerStarted) {
        try {
          const res = await api.post(`/api/lectures/${lectureId}/background-view`, { watch_session_id: watchSessionId })
          setBgTimerStarted(true)
          if (res.data.reload) window.location.reload()
        } catch {}
      }
    }, 3 * 60 * 60 * 1000)

    return () => {
      clearTimeout(viewTimerRef.current)
      clearTimeout(bgTimerRef.current)
    }
  }, [watchSessionId])

  const watermarkText = student?.full_name || student?.student_code || ''

  const renderPlayer = () => {
    if (videoType === 'youtube') {
      const vid = getYouTubeId(videoUrl)
      return (
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1&showinfo=0&controls=1&iv_load_policy=3&disablekb=1`}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="video"
        />
      )
    }
    if (videoType === 'embed') {
      return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: videoUrl }} />
    }
    if (videoType === 'direct') {
      return <video src={videoUrl} controls className="w-full h-full" controlsList="nodownload" />
    }
    return <div className="flex items-center justify-center h-full text-gray-400">فيديو غير متاح</div>
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ aspectRatio: '16/9', background: '#000', userSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      {renderPlayer()}

      {/* Watermark overlay */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 10 }}
      >
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute text-white/10 font-bold text-sm whitespace-nowrap"
            style={{
              top: `${10 + i * 16}%`,
              right: `${5 + (i % 3) * 30}%`,
              transform: 'rotate(-20deg)',
              fontSize: '11px',
            }}
          >
            {watermarkText}
          </span>
        ))}
      </div>

      {/* Block right-click overlay */}
      <div className="absolute inset-0" style={{ zIndex: 5, pointerEvents: 'none' }} />
    </div>
  )
}
