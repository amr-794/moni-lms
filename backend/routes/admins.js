const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const { requirePermission } = require('../middleware/adminMiddleware');

router.get('/', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('admins').select('id,username,display_name,permissions,is_super_admin,is_active,created_at').order('created_at');
  res.json(data || []);
});

router.post('/', adminMiddleware, requirePermission('manage_admins'), async (req, res) => {
  try {
    const { username, password, display_name, permissions } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('admins').insert({
      username, password_hash, display_name, permissions: permissions || {}, parent_admin_id: req.admin.id
    }).select('id,username,display_name,permissions,is_super_admin,is_active,created_at').single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'اسم المستخدم مستخدم مسبقاً' });
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', adminMiddleware, requirePermission('manage_admins'), async (req, res) => {
  const { password, ...rest } = req.body;
  const updates = { ...rest };
  if (password) updates.password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('admins').update(updates).eq('id', req.params.id).select('id,username,display_name,permissions,is_super_admin,is_active').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', adminMiddleware, requirePermission('manage_admins'), async (req, res) => {
  if (req.params.id === req.admin.id) return res.status(400).json({ error: 'لا يمكن حذف حسابك الخاص' });
  await supabase.from('admins').delete().eq('id', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
