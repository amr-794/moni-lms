import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('general')

  useEffect(() => {
    api.get('/api/settings').then(({ data }) => setSettings(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await api.put('/api/settings', settings)
      setMsg({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' })
      // Apply theme immediately
      const colors = settings.theme_colors
      if (colors) {
        document.documentElement.style.setProperty('--primary', colors.primary)
        document.documentElement.style.setProperty('--secondary', colors.secondary)
        document.documentElement.style.setProperty('--accent', colors.accent)
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'خطأ في الحفظ' })
    } finally { setSaving(false) }
  }

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))
  const setNested = (k, field, v) => setSettings(s => ({ ...s, [k]: { ...(s[k] || {}), [field]: v } }))
  const setSocial = (i, field, v) => {
    const arr = [...(settings.social_links || [])]
    arr[i] = { ...arr[i], [field]: v }
    set('social_links', arr)
  }

  const tabs = ['general', 'theme', 'social', 'security']

  if (loading) return <AdminLayout title="الإعدادات"><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}></div></div></AdminLayout>

  return (
    <AdminLayout title="الإعدادات">
      <div className="flex gap-2 mb-6 flex-wrap">
        {['general', 'theme', 'social', 'security'].map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
            style={{ background: tab === t ? 'var(--primary)' : 'var(--card)', color: tab === t ? 'white' : 'var(--text2)', border: '1px solid var(--border)' }}>
            {t === 'general' ? '⚙️ عام' : t === 'theme' ? '🎨 الألوان' : t === 'social' ? '🔗 روابط التواصل' : '🔒 أمان'}
          </button>
        ))}
      </div>

      {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: msg.type === 'success' ? 'rgba(67,233,123,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? 'var(--accent)' : '#f87171' }}>{msg.text}</div>}

      <div className="card">
        {tab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>اسم الموقع</label>
              <input className="input-field" value={settings.site_name || ''} onChange={e => set('site_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رابط شعار الموقع</label>
              <input className="input-field" value={settings.site_logo || ''} onChange={e => set('site_logo', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نص العلامة المائية</label>
              <input className="input-field" value={settings.watermark_text || ''} onChange={e => set('watermark_text', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رسالة البانر (اتركها فارغة لإخفائه)</label>
              <input className="input-field" value={settings.banner_message || ''} onChange={e => set('banner_message', e.target.value || null)} placeholder="اكتب رسالة للطلاب..." />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>كلمة المرور الافتراضية للطلاب الجدد</label>
              <input className="input-field" value={settings.default_password || '123456'} onChange={e => set('default_password', e.target.value)} />
            </div>
          </div>
        )}

        {tab === 'theme' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text2)' }}>اختر ألوان المنصة - ستُطبَّق فوراً على كل الصفحات</p>
            {[
              { k: 'primary', l: 'اللون الرئيسي' },
              { k: 'secondary', l: 'اللون الثانوي' },
              { k: 'accent', l: 'لون التمييز' },
            ].map(({ k, l }) => (
              <div key={k} className="flex items-center gap-3">
                <label className="text-sm w-32 flex-shrink-0" style={{ color: 'var(--text2)' }}>{l}</label>
                <input type="color" className="w-12 h-10 rounded-xl cursor-pointer border-0"
                  value={settings.theme_colors?.[k] || '#6c63ff'}
                  onChange={e => setNested('theme_colors', k, e.target.value)}
                  style={{ background: 'none' }} />
                <input className="input-field flex-1 font-mono text-sm"
                  value={settings.theme_colors?.[k] || '#6c63ff'}
                  onChange={e => setNested('theme_colors', k, e.target.value)} />
                <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: settings.theme_colors?.[k] || '#6c63ff' }}></div>
              </div>
            ))}
            <div className="mt-4 p-4 rounded-xl flex gap-3" style={{ background: 'var(--bg2)' }}>
              <div className="w-12 h-12 rounded-xl" style={{ background: settings.theme_colors?.primary }}></div>
              <div className="w-12 h-12 rounded-xl" style={{ background: settings.theme_colors?.secondary }}></div>
              <div className="w-12 h-12 rounded-xl" style={{ background: settings.theme_colors?.accent }}></div>
              <span className="self-center text-sm" style={{ color: 'var(--text2)' }}>معاينة الألوان</span>
            </div>
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text2)' }}>روابط التواصل الاجتماعي (تظهر في فوتر الصفحة الرئيسية)</p>
            {(settings.social_links || []).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm w-24 flex-shrink-0" style={{ color: 'var(--text2)' }}>{s.platform}</span>
                <input className="input-field flex-1" placeholder="https://..." value={s.url || ''} onChange={e => setSocial(i, 'url', e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={settings.block_desktop_watch === true || settings.block_desktop_watch === 'true'}
                  onChange={e => set('block_desktop_watch', e.target.checked)} />
                <div className="w-11 h-6 rounded-full transition-all" style={{ background: settings.block_desktop_watch ? 'var(--primary)' : 'var(--bg3)' }}>
                  <div className="w-5 h-5 bg-white rounded-full shadow transition-all mt-0.5" style={{ marginRight: settings.block_desktop_watch ? '2px' : '22px' }}></div>
                </div>
              </div>
              <div>
                <p className="font-bold text-sm">منع مشاهدة المحاضرات من الكمبيوتر</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>سيُمنع الطلاب من مشاهدة المحاضرات على الحاسوب</p>
              </div>
            </label>
            {(settings.block_desktop_watch === true || settings.block_desktop_watch === 'true') && (
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>رابط التطبيق البديل</label>
                <input className="input-field" value={settings.desktop_block_app_link || ''} onChange={e => set('desktop_block_app_link', e.target.value)} placeholder="https://play.google.com/..." />
              </div>
            )}
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>مدة تذكرني (أيام)</label>
              <input type="number" className="input-field w-32" value={settings.remember_me_days || 30} onChange={e => set('remember_me_days', +e.target.value)} min={1} max={365} />
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving} className="btn-primary mt-6 px-8">
          {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </div>
    </AdminLayout>
  )
}
