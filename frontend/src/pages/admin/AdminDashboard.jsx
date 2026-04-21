import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})

  useEffect(() => {
    Promise.all([
      api.get('/api/students?limit=1').then(r => r.data.total).catch(() => 0),
      api.get('/api/courses').then(r => r.data.length).catch(() => 0),
      api.get('/api/results?limit=1').then(r => r.data.total).catch(() => 0),
      api.get('/api/online').then(r => r.data.length).catch(() => 0),
    ]).then(([students, courses, results, online]) => setStats({ students, courses, results, online }))
  }, [])

  const cards = [
    { label: 'إجمالي الطلاب', value: stats.students || 0, icon: 'fas fa-users', color: 'var(--primary)' },
    { label: 'الكورسات', value: stats.courses || 0, icon: 'fas fa-book', color: 'var(--accent)' },
    { label: 'امتحانات مسلَّمة', value: stats.results || 0, icon: 'fas fa-file-alt', color: 'var(--secondary)' },
    { label: 'متصل الآن', value: stats.online || 0, icon: 'fas fa-circle', color: '#22c55e' },
  ]

  return (
    <AdminLayout title="لوحة التحكم">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: c.color + '20' }}>
                <i className={c.icon} style={{ color: c.color }}></i>
              </div>
              <div>
                <div className="text-2xl font-black">{c.value}</div>
                <div className="text-xs" style={{ color: 'var(--text2)' }}>{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="font-bold mb-4">🚀 روابط سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'إضافة طالب', href: '/admin/students', icon: '👤' },
            { label: 'إضافة كورس', href: '/admin/courses', icon: '📚' },
            { label: 'توليد أكواد', href: '/admin/lecture-codes', icon: '🔑' },
            { label: 'إرسال إشعار', href: '/admin/notifications', icon: '🔔' },
          ].map((l, i) => (
            <a key={i} href={l.href} className="card flex items-center gap-2 text-sm hover:scale-[1.02] transition-all" style={{ padding: '12px' }}>
              <span>{l.icon}</span><span>{l.label}</span>
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
