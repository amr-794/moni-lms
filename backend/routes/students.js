const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/students
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { grade_id, search, page = 1, limit = 50 } = req.query;
    let query = supabase.from('students').select('*, grades(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    
    if (grade_id) query = query.eq('grade_id', grade_id);
    if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,student_code.ilike.%${search}%`);
    
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ students: data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('students').select('*, grades(name)').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'الطالب غير موجود' });
  const { password_hash: _, ...safe } = data;
  res.json(safe);
});

// POST /api/students
router.post('/', adminMiddleware, requirePermission('manage_students'), async (req, res) => {
  try {
    const { full_name, phone, parent_phone, email, password, grade_id } = req.body;
    if (!full_name || !phone || !parent_phone || !email || !grade_id) return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    
    const pwd = password || '123456';
    const password_hash = await bcrypt.hash(pwd, 10);
    const { data, error } = await supabase.from('students').insert({
      full_name, phone, parent_phone, email, password_hash, grade_id, default_password: pwd
    }).select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
      throw error;
    }
    const { password_hash: _, ...safe } = data;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', adminMiddleware, requirePermission('manage_students'), async (req, res) => {
  try {
    const { full_name, phone, parent_phone, email, grade_id, is_active, ban_until, ban_reason, password } = req.body;
    const updates = { full_name, phone, parent_phone, email, grade_id, is_active };
    if (ban_until !== undefined) updates.ban_until = ban_until;
    if (ban_reason !== undefined) updates.ban_reason = ban_reason;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    
    const { data, error } = await supabase.from('students').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    const { password_hash: _, ...safe } = data;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', adminMiddleware, requirePermission('manage_students'), async (req, res) => {
  const { error } = await supabase.from('students').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'تم حذف الطالب' });
});

// POST /api/students/:id/approve-password-change
router.post('/:id/approve-password-change', adminMiddleware, requirePermission('manage_students'), async (req, res) => {
  await supabase.from('students').update({ password_change_approved: true }).eq('id', req.params.id);
  res.json({ message: 'تم الموافقة على طلب تغيير كلمة المرور' });
});

// GET /api/students/password-change-requests
router.get('/admin/password-requests', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('students').select('id, full_name, phone, email, grades(name), password_change_expires_at')
    .eq('password_change_requested', true).eq('password_change_approved', false);
  res.json(data || []);
});

module.exports = router;
