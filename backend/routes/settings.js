const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/settings
router.get('/', async (req, res) => {
  const { data } = await supabase.from('site_settings').select('*');
  const settings = {};
  (data || []).forEach(row => { settings[row.key] = row.value; });
  res.json(settings);
});

// PUT /api/settings
router.put('/', adminMiddleware, requirePermission('manage_settings'), async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    }
    res.json({ message: 'تم حفظ الإعدادات' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
