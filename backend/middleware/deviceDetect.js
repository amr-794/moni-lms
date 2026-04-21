const deviceDetect = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPod/.test(ua)) deviceType = 'mobile';
  else if (/iPad|Tablet/.test(ua)) deviceType = 'tablet';
  req.deviceType = deviceType;
  req.ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.connection?.remoteAddress || '';
  next();
};

module.exports = deviceDetect;
