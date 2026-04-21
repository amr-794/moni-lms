import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function Home() {
  const [settings, setSettings] = useState({})

  useEffect(() => {
    api.get('/api/settings').then(({ data }) => setSettings(data)).catch(() => {})
  }, [])

  const social = settings.social_links || []

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-10"
            style={{
              width: `${60 + i * 20}px`, height: `${60 + i * 20}px`,
              background: i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)',
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="font-black text-2xl" style={{ color: 'var(--primary)' }}>
          📚 {settings.site_name || 'منصة محمود منير'}
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary">تسجيل الدخول</Link>
          <Link to="/register" className="btn-primary">إنشاء حساب</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="float mb-8">
          <div className="w-40 h-40 rounded-full mx-auto shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '4px' }}>
            <div className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg2)', fontSize: '60px' }}>
              👨‍🏫
            </div>
          </div>
        </div>

        <h1 className="text-5xl font-black mb-4" style={{ color: 'var(--text)' }}>
          أ. <span style={{ color: 'var(--primary)' }}>محمود منير</span>
        </h1>
        <p className="text-xl mb-2" style={{ color: 'var(--text2)' }}>منصة تعليمية متكاملة</p>
        <p className="text-base mb-10 max-w-md" style={{ color: 'var(--text2)' }}>
          محاضرات، امتحانات، ومتابعة مستمرة لأفضل تجربة تعليمية
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/register" className="btn-primary text-lg px-8 py-3 pulse-glow">
            ابدأ الآن 🚀
          </Link>
          <Link to="/login" className="btn-secondary text-lg px-8 py-3">
            لديك حساب؟ ادخل
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: '🎬', title: 'محاضرات تفاعلية', desc: 'فيديوهات عالية الجودة مع نظام مشاهدة ذكي' },
            { icon: '📝', title: 'امتحانات احترافية', desc: 'امتحانات متعددة الأنواع مع حفظ التقدم' },
            { icon: '📊', title: 'متابعة مستمرة', desc: 'تتبع نتائجك وتقدمك في كل وقت' },
          ].map((f, i) => (
            <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8 text-center" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-center gap-4 mb-4">
          {social.filter(s => s.url).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:scale-110 transition-all"
              style={{ background: 'var(--bg3)', color: 'var(--primary)' }}>
              <i className={s.icon || `fab fa-${s.platform}`}></i>
            </a>
          ))}
        </div>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          © 2025 {settings.site_name || 'منصة محمود منير التعليمية'} - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  )
}
