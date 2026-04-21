const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/results - admin
router.get('/', adminMiddleware, async (req, res) => {
  const { exam_id, student_id, page = 1, limit = 50 } = req.query;
  let query = supabase.from('exam_sessions')
    .select('*, students(full_name,student_code,phone,grades(name)), exams(title,exam_identifier)', { count: 'exact' })
    .eq('is_submitted', true)
    .order('submitted_at', { ascending: false })
    .range((page-1)*limit, page*limit-1);
  if (exam_id) query = query.eq('exam_id', exam_id);
  if (student_id) query = query.eq('student_id', student_id);
  const { data, count } = await query;
  res.json({ results: data || [], total: count });
});

// GET /api/results/:id - admin
router.get('/:id', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('exam_sessions')
    .select('*, students(full_name,student_code,phone,parent_phone,grades(name)), exams(*, questions(*, choices(*)))')
    .eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'غير موجود' });
  res.json(data);
});

// GET /api/results/student/my - for student
router.get('/student/my', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('exam_sessions')
    .select('*, exams(title,exam_identifier,result_mode,result_date)')
    .eq('student_id', req.student.id)
    .eq('is_submitted', true)
    .order('submitted_at', { ascending: false });
  res.json(data || []);
});

// PUT /api/results/:id/visibility
router.put('/:id/visibility', adminMiddleware, requirePermission('view_results'), async (req, res) => {
  const { is_result_visible } = req.body;
  await supabase.from('exam_sessions').update({ is_result_visible }).eq('id', req.params.id);
  res.json({ message: 'تم التحديث' });
});

module.exports = router;
