const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const deviceDetect = require('../middleware/deviceDetect');

// POST /api/online/ping - student heartbeat
router.post('/ping', authMiddleware, deviceDetect, async (req, res) => {
  const { current_page } = req.body;
  await supabase.from('online_users').upsert({
    student_id: req.student.id,
    last_ping: new Date().toISOString(),
    current_page: current_page || '/',
    device_type: req.deviceType,
    ip_address: req.ipAddress
  });
  res.json({ ok: true });
});

// GET /api/online - admin
router.get('/', adminMiddleware, async (req, res) => {
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - 5);
  const { data } = await supabase.from('online_users')
    .select('*, students(full_name,student_code,grades(name))')
    .gt('last_ping', cutoff.toISOString())
    .order('last_ping', { ascending: false });
  res.json(data || []);
});

// ======= BANS =======
// GET /api/online/bans
router.get('/bans', adminMiddleware, async (req, res) => {
  const { student_id } = req.query;
  let query = supabase.from('content_bans').select('*, students(full_name,student_code)').order('created_at', { ascending: false });
  if (student_id) query = query.eq('student_id', student_id);
  const { data } = await query;
  res.json(data || []);
});

// POST /api/online/bans
router.post('/bans', adminMiddleware, async (req, res) => {
  const { student_id, content_type, content_id, reason } = req.body;
  const { data, error } = await supabase.from('content_bans').upsert({
    student_id, content_type, content_id, reason, created_by: req.admin.id
  }, { onConflict: 'student_id,content_type,content_id' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/online/bans/:id
router.delete('/bans/:id', adminMiddleware, async (req, res) => {
  await supabase.from('content_bans').delete().eq('id', req.params.id);
  res.json({ message: 'تم رفع الحظر' });
});

// POST /api/online/ban-account - ban student account
router.post('/ban-account', adminMiddleware, async (req, res) => {
  const { student_id, ban_until, ban_reason } = req.body;
  await supabase.from('students').update({ ban_until, ban_reason }).eq('id', student_id);
  // Invalidate all sessions
  await supabase.from('sessions').update({ is_active: false }).eq('student_id', student_id);
  res.json({ message: 'تم حظر الحساب' });
});

// POST /api/online/unban-account
router.post('/unban-account', adminMiddleware, async (req, res) => {
  const { student_id } = req.body;
  await supabase.from('students').update({ ban_until: null, ban_reason: null }).eq('id', student_id);
  res.json({ message: 'تم رفع الحظر' });
});

module.exports = router;
