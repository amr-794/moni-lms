import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import api from '../../utils/api'

export default function MadeBy() {
  const [config, setConfig] = useState({ show: true, label: 'صُنع بواسطة عمرو عبد الهادي', balls: [] })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api.get('/api/settings').then(({ data }) => {
      if (data.made_by_ball) setConfig(data.made_by_ball)
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      await api.put('/api/settings', { made_by_ball: config })
      setMsg({ type: 'success', text: 'تم الحفظ' })
    } catch { setMsg({ type: 'error', text: 'خطأ في الحفظ' }) } finally { setSaving(false) }
  }

  const addBall = () => setConfig(c => ({ ...c, balls: [...(c.balls || []), { icon: 'fab fa-facebook', url: '', label: '' }] }))
  const removeBall = (i) => setConfig(c => ({ ...c, balls: c.balls.filter((_, ci) => ci !== i) }))
  const setBall = (i, k, v) => setConfig(c => ({ ...c, balls: c.balls.map((b, bi) => bi === i ? { ...b, [k]: v } : b) }))

  return (
    <AdminLayout title="كرة صنع بواسطة">
      <div className="max-w-2xl">
        {msg && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: msg.type === 'success' ? 'rgba(67,233,123,0.1)' : 'rgba(239,68,68,0.1)', color: msg.type === 'success' ? 'var(--accent)' : '#f87171' }}>{msg.text}</div>}

        <div className="card mb-6">
          <h3 className="font-bold mb-4">⚙️ الإعدادات الأساسية</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config.show} onChange={e => setConfig(c => ({ ...c, show: e.target.checked }))} style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
              <span className="font-bold">إظهار الكرة في الموقع</span>
            </label>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text2)' }}>نص الكرة الرئيسية (tooltip)</label>
              <input className="input-field" value={config.label || ''} onChange={e => setConfig(c => ({ ...c, label: e.target.value }))} placeholder="صُنع بواسطة..." />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">🔵 الكرات الفرعية</h3>
            <button onClick={addBall} className="btn-primary text-sm px-4 py-2">+ كرة جديدة</button>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>تظهر عند الضغط على الكرة الرئيسية بأنيميشن سلس</p>

          {(config.balls || []).length === 0 && (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--text2)' }}>لا توجد كرات بعد - اضغط + لإضافة</p>
          )}

          <div className="space-y-4">
            {(config.balls || []).map((ball, i) => (
              <div key={i} className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">كرة {i + 1}</span>
                  <button onClick={() => removeBall(i)} className="text-sm px-2 py-1 rounded-lg" style={{ color: '#f87171' }}>✕ حذف</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text2)' }}>أيقونة FontAwesome</label>
                    <input className="input-field text-sm" value={ball.icon || ''} onChange={e => setBall(i, 'icon', e.target.value)} placeholder="fab fa-facebook" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text2)' }}>الرابط</label>
                    <input className="input-field text-sm" value={ball.url || ''} onChange={e => setBall(i, 'url', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text2)' }}>التسمية (tooltip)</label>
                    <input className="input-field text-sm" value={ball.label || ''} onChange={e => setBall(i, 'label', e.target.value)} placeholder="فيسبوك" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text2)' }}>رابط صورة (بديل الأيقونة)</label>
                    <input className="input-field text-sm" value={ball.image || ''} onChange={e => setBall(i, 'image', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text2)' }}>معاينة:</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                    {ball.image ? <img src={ball.image} className="w-full h-full object-cover rounded-full" /> : <i className={ball.icon || 'fas fa-link'}></i>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary px-8">
          {saving ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
        </button>
      </div>
    </AdminLayout>
  )
}
