const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/notifications - student
router.get('/', authMiddleware, async (req, res) => {
  const { data } = await supabase.from('notifications')
    .select('*')
    .or(`type.eq.global,and(type.eq.personal,target_student_id.eq.${req.student.id}),type.eq.banner`)
    .order('created_at', { ascending: false })
    .limit(50);
  res.json(data || []);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id);
  res.json({ message: 'تم' });
});

// GET /api/notifications/admin/all - admin
router.get('/admin/all', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('notifications')
    .select('*, students(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  res.json(data || []);
});

// POST /api/notifications - admin send
router.post('/', adminMiddleware, requirePermission('manage_notifications'), async (req, res) => {
  try {
    const { title, body, type, target_student_id, grade_id } = req.body;
    if (!body) return res.status(400).json({ error: 'يرجى كتابة نص الإشعار' });

    if (type === 'personal' && !target_student_id) return res.status(400).json({ error: 'يرجى تحديد الطالب' });

    if (type === 'global' && grade_id) {
      // Send to all students of a grade
      const { data: students } = await supabase.from('students').select('id').eq('grade_id', grade_id).eq('is_active', true);
      const notifications = students.map(s => ({ title, body, type: 'personal', target_student_id: s.id, created_by: req.admin.id }));
      await supabase.from('notifications').insert(notifications);
      return res.status(201).json({ message: `تم إرسال الإشعار لـ ${students.length} طالب` });
    }

    const { data, error } = await supabase.from('notifications').insert({
      title, body, type: type || 'global', target_student_id: target_student_id || null, created_by: req.admin.id
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', adminMiddleware, requirePermission('manage_notifications'), async (req, res) => {
  await supabase.from('notifications').delete().eq('id', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
