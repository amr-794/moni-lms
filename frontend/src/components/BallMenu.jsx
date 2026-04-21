import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function BallMenu() {
  const [open, setOpen] = useState(false)
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.get('/api/settings').then(({ data }) => {
      if (data.made_by_ball) setConfig(data.made_by_ball)
    }).catch(() => {})
  }, [])

  if (!config?.show) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
      {open && config.balls?.map((ball, i) => (
        <a
          key={i}
          href={ball.url || '#'}
          target="_blank"
          rel="noreferrer"
          title={ball.label}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200"
          style={{
            background: 'var(--primary)',
            animation: `ballIn 0.3s ease ${i * 0.05}s both`,
            transform: open ? 'scale(1)' : 'scale(0)',
          }}
        >
          {ball.image
            ? <img src={ball.image} alt={ball.label} className="w-full h-full object-cover rounded-full" />
            : <i className={ball.icon + ' text-sm'} />}
        </a>
      ))}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl font-bold text-xs text-center leading-tight transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, var(--primary), var(--secondary))`,
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          boxShadow: '0 4px 20px rgba(108,99,255,0.5)',
        }}
        title={config.label}
      >
        {open ? '✕' : '⚡'}
      </button>

      <style>{`
        @keyframes ballIn {
          from { opacity: 0; transform: scale(0) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
