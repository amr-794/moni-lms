const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
const deviceDetect = require('../middleware/deviceDetect');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};

// POST /api/auth/register
router.post('/register', deviceDetect, async (req, res) => {
  try {
    const { full_name, phone, parent_phone, email, password, grade_id } = req.body;
    if (!full_name || !phone || !parent_phone || !email || !password || !grade_id) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('students').insert({
      full_name, phone, parent_phone, email, password_hash, grade_id
    }).select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
      throw error;
    }
    res.status(201).json({ message: 'تم إنشاء الحساب بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', deviceDetect, async (req, res) => {
  try {
    const { identifier, password, remember_me } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'يرجى إدخال بيانات الدخول' });

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .single();

    if (error || !student) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    if (!student.is_active) return res.status(403).json({ error: 'الحساب موقوف' });
    if (student.ban_until && new Date(student.ban_until) > new Date()) {
      return res.status(403).json({ error: 'الحساب محظور حتى ' + new Date(student.ban_until).toLocaleString('ar-EG') });
    }

    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    // Invalidate old sessions
    const { data: oldSessions } = await supabase.from('sessions').select('id,token').eq('student_id', student.id).eq('is_active', true);
    if (oldSessions?.length) {
      await supabase.from('sessions').update({ is_active: false }).eq('student_id', student.id);
      // Notify old sessions via realtime (handled by frontend subscription)
    }

    const expiresIn = remember_me ? '30d' : '1d';
    const token = jwt.sign({ id: student.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn });

    await supabase.from('sessions').insert({
      student_id: student.id,
      token,
      device_type: req.deviceType,
      ip_address: req.ipAddress,
      device_info: { ua: req.headers['user-agent'] },
    });

    const maxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : undefined;
    res.cookie('token', token, { ...COOKIE_OPTIONS, ...(maxAge ? { maxAge } : {}) });
    
    const { password_hash: _, ...safeStudent } = student;
    res.json({ student: safeStudent, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'يرجى إدخال بيانات الدخول' });

    const { data: admin, error } = await supabase
      .from('admins').select('*').eq('username', username).eq('is_active', true).single();

    if (error || !admin) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });

    const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('admin_token', token, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    const { password_hash: _, ...safeAdmin } = admin;
    res.json({ admin: safeAdmin, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    await supabase.from('sessions').update({ is_active: false }).eq('token', token);
  }
  res.clearCookie('token', COOKIE_OPTIONS);
  res.clearCookie('admin_token', COOKIE_OPTIONS);
  res.json({ message: 'تم تسجيل الخروج' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const { password_hash: _, ...safeStudent } = req.student;
  res.json({ student: safeStudent });
});

// GET /api/auth/admin-me
router.get('/admin-me', adminMiddleware, (req, res) => {
  const { password_hash: _, ...safeAdmin } = req.admin;
  res.json({ admin: safeAdmin });
});

// POST /api/auth/request-password-change
router.post('/request-password-change', authMiddleware, async (req, res) => {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  await supabase.from('students').update({
    password_change_requested: true,
    password_change_expires_at: expires.toISOString()
  }).eq('id', req.student.id);
  res.json({ message: 'تم إرسال طلب تغيير كلمة المرور' });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    
    const student = req.student;
    if (!student.password_change_approved) return res.status(403).json({ error: 'لم يتم الموافقة على طلب تغيير كلمة المرور' });
    if (student.password_change_expires_at && new Date(student.password_change_expires_at) < new Date()) {
      return res.status(403).json({ error: 'انتهت صلاحية طلب تغيير كلمة المرور' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await supabase.from('students').update({
      password_hash,
      password_change_requested: false,
      password_change_approved: false,
      password_change_expires_at: null
    }).eq('id', student.id);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
