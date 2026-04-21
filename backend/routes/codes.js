const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

function generateCode(prefix = '', length = 8) {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let code = prefix ? prefix.toUpperCase() + '-' : '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ======= LECTURE CODES =======
router.get('/lecture', adminMiddleware, async (req, res) => {
  const { lecture_id } = req.query;
  let query = supabase.from('lecture_codes').select('*, lectures(title), students(full_name,student_code)').order('created_at', { ascending: false });
  if (lecture_id) query = query.eq('lecture_id', lecture_id);
  const { data } = await query;
  res.json(data || []);
});

router.post('/lecture/generate', adminMiddleware, requirePermission('manage_codes'), async (req, res) => {
  try {
    const { lecture_id, count = 1, prefix, view_limit = 3, expires_at } = req.body;
    if (!lecture_id) return res.status(400).json({ error: 'يرجى تحديد المحاضرة' });
    
    const codes = [];
    for (let i = 0; i < Math.min(count, 500); i++) {
      let code;
      let tries = 0;
      do {
        code = generateCode(prefix);
        tries++;
      } while (tries < 10);
      codes.push({ code, lecture_id, prefix, expires_at, created_by: req.admin.id });
    }

    const { data, error } = await supabase.from('lecture_codes').insert(codes).select();
    if (error) throw error;
    res.status(201).json({ generated: data.length, codes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lecture/redeem', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'يرجى إدخال الكود' });

    const { data: lectureCode } = await supabase.from('lecture_codes').select('*, lectures(title, view_limit)')
      .eq('code', code.toUpperCase().trim()).single();

    if (!lectureCode) return res.status(404).json({ error: 'الكود غير صحيح' });
    if (lectureCode.is_used) return res.status(400).json({ error: 'الكود مستخدم مسبقاً' });
    if (lectureCode.expires_at && new Date(lectureCode.expires_at) < new Date()) {
      return res.status(400).json({ error: 'انتهت صلاحية الكود' });
    }

    // Check if student already has access
    const { data: existing } = await supabase.from('student_lecture_access')
      .select('*').eq('student_id', req.student.id).eq('lecture_id', lectureCode.lecture_id).single();

    const viewLimit = lectureCode.lectures?.view_limit || 3;

    if (existing) {
      // Add more views
      await supabase.from('student_lecture_access').update({
        views_remaining: existing.views_remaining + viewLimit,
        total_views_granted: existing.total_views_granted + viewLimit
      }).eq('id', existing.id);
    } else {
      await supabase.from('student_lecture_access').insert({
        student_id: req.student.id,
        lecture_id: lectureCode.lecture_id,
        views_remaining: viewLimit,
        total_views_granted: viewLimit
      });
    }

    await supabase.from('lecture_codes').update({
      is_used: true,
      used_by: req.student.id,
      used_at: new Date().toISOString()
    }).eq('id', lectureCode.id);

    res.json({ message: `تم فتح المحاضرة بنجاح! لديك ${viewLimit} مشاهدات`, lecture_title: lectureCode.lectures?.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======= EXAM CODES =======
router.get('/exam', adminMiddleware, async (req, res) => {
  const { exam_id } = req.query;
  let query = supabase.from('exam_codes').select('*, exams(title), students(full_name,student_code)').order('created_at', { ascending: false });
  if (exam_id) query = query.eq('exam_id', exam_id);
  const { data } = await query;
  res.json(data || []);
});

router.post('/exam/generate', adminMiddleware, requirePermission('manage_codes'), async (req, res) => {
  try {
    const { exam_id, count = 1 } = req.body;
    if (!exam_id) return res.status(400).json({ error: 'يرجى تحديد الامتحان' });
    const codes = Array.from({ length: Math.min(count, 500) }, () => ({ code: generateCode(), exam_id, created_by: req.admin.id }));
    const { data, error } = await supabase.from('exam_codes').insert(codes).select();
    if (error) throw error;
    res.status(201).json({ generated: data.length, codes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/exam/redeem', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const { data: examCode } = await supabase.from('exam_codes').select('*, exams(title)').eq('code', code.toUpperCase().trim()).single();
    if (!examCode) return res.status(404).json({ error: 'الكود غير صحيح' });
    if (examCode.is_used) return res.status(400).json({ error: 'الكود مستخدم مسبقاً' });

    await supabase.from('exam_codes').update({ is_used: true, used_by: req.student.id, used_at: new Date().toISOString() }).eq('id', examCode.id);
    
    // Create exam session to grant access
    await supabase.from('exam_sessions').upsert({
      student_id: req.student.id,
      exam_id: examCode.exam_id,
    }, { onConflict: 'student_id,exam_id', ignoreDuplicates: true });

    res.json({ message: 'تم فتح الامتحان بنجاح!', exam_title: examCode.exams?.title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE code
router.delete('/lecture/:id', adminMiddleware, requirePermission('manage_codes'), async (req, res) => {
  await supabase.from('lecture_codes').delete().eq('id', req.params.id);
  res.json({ message: 'تم الحذف' });
});

router.delete('/exam/:id', adminMiddleware, requirePermission('manage_codes'), async (req, res) => {
  await supabase.from('exam_codes').delete().eq('id', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
