const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

// ======= COURSES =======
router.get('/', async (req, res) => {
  const { grade_id, admin } = req.query;
  let query = supabase.from('courses').select('*, grades(name), playlists(id,name,display_order,is_active)').order('display_order');
  if (grade_id) query = query.eq('grade_id', grade_id);
  if (!admin) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('courses').select('*, grades(name), playlists(*, lectures(id,title,is_free,is_active,display_order))').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'الكورس غير موجود' });
  res.json(data);
});

router.post('/', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { name, cover_url, grade_id, display_order } = req.body;
  const { data, error } = await supabase.from('courses').insert({ name, cover_url, grade_id, display_order, created_by: req.admin.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { data, error } = await supabase.from('courses').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  await supabase.from('courses').delete().eq('id', req.params.id);
  res.json({ message: 'تم حذف الكورس' });
});

// ======= PLAYLISTS =======
router.get('/:courseId/playlists', async (req, res) => {
  const { data } = await supabase.from('playlists').select('*, lectures(id,title,is_free,is_active,display_order,cover_url)').eq('course_id', req.params.courseId).order('display_order');
  res.json(data || []);
});

router.post('/:courseId/playlists', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { name, cover_url, display_order, grade_id } = req.body;
  const { data, error } = await supabase.from('playlists').insert({
    course_id: req.params.courseId, name, cover_url, display_order, grade_id, created_by: req.admin.id
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/playlists/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { data, error } = await supabase.from('playlists').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/playlists/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  await supabase.from('playlists').delete().eq('id', req.params.id);
  res.json({ message: 'تم حذف القائمة' });
});

module.exports = router;
