const jwt = require('jsonwebtoken');
const supabase = require('../supabase');

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'غير مصرح' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'غير مصرح' });

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('id', decoded.id)
      .eq('is_active', true)
      .single();

    if (!admin) return res.status(401).json({ error: 'حساب الأدمن غير موجود' });

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'جلسة غير صالحة' });
    }
    next(err);
  }
};

// Check specific permission
const requirePermission = (permission) => (req, res, next) => {
  if (req.admin?.is_super_admin) return next();
  if (req.admin?.permissions?.[permission]) return next();
  return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
};

module.exports = adminMiddleware;
module.exports.requirePermission = requirePermission;
