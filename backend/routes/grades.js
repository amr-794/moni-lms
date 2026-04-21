const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', async (req, res) => {
  const { data } = await supabase.from('grades').select('*').eq('is_active', true).order('display_order');
  res.json(data || []);
});

router.post('/', adminMiddleware, async (req, res) => {
  const { name, display_order } = req.body;
  const { data, error } = await supabase.from('grades').insert({ name, display_order, created_by: req.admin.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { data, error } = await supabase.from('grades').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  await supabase.from('grades').delete().eq('id', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
