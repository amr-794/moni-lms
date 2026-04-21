import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../utils/api'

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/notifications').then(({ data }) => setNotifs(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markRead = async (id) => {
    await api.put(`/api/notifications/${id}/read`).catch(() => {})
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const fmt = d => new Date(d).toLocaleString('ar-EG', { hour12: true })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black mb-6">🔔 الإشعارات</h1>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">لا توجد إشعارات</div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
                className="card cursor-pointer hover:scale-[1.005] transition-all"
                style={{ opacity: n.is_read ? 0.7 : 1, borderColor: !n.is_read ? 'var(--primary)' : 'var(--border)' }}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{n.type === 'banner' ? '📢' : n.type === 'global' ? '🌐' : '💌'}</span>
                  <div className="flex-1">
                    {n.title && <h3 className="font-bold mb-1">{n.title}</h3>}
                    <p className="text-sm" style={{ color: 'var(--text2)' }}>{n.body}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text2)' }}>{fmt(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--primary)' }}></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
