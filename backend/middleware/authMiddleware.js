const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح - يرجى تسجيل الدخول' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'student') return res.status(403).json({ error: 'غير مصرح' });

    // Check session in DB
    const { data: session } = await supabase
      .from('sessions')
      .select('*, students(*)')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (!session) return res.status(401).json({ error: 'انتهت الجلسة - يرجى تسجيل الدخول مجدداً' });

    const student = session.students;
    if (!student.is_active) return res.status(403).json({ error: 'الحساب موقوف' });

    // Check ban
    if (student.ban_until && new Date(student.ban_until) > new Date()) {
      return res.status(403).json({ 
        error: 'الحساب محظور',
        ban_until: student.ban_until,
        ban_reason: student.ban_reason
      });
    }

    // Update last_seen
    await supabase.from('sessions').update({ last_seen: new Date().toISOString() }).eq('id', session.id);

    req.student = student;
    req.session = session;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'جلسة غير صالحة' });
    }
    next(err);
  }
};

module.exports = authMiddleware;
