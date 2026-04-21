const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const supabase = require('./supabase');

const app = express();

// =================== MIDDLEWARE ===================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =================== ROUTES ===================
app.use('/api/init',        require('./routes/init'));
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/courses',     require('./routes/courses'));
app.use('/api/lectures',    require('./routes/lectures'));
app.use('/api/exams',       require('./routes/exams'));
app.use('/api/codes',       require('./routes/codes'));
app.use('/api/results',     require('./routes/results'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/admins',      require('./routes/admins'));
app.use('/api/grades',      require('./routes/grades'));
app.use('/api/online',      require('./routes/online'));

// =================== HEALTH CHECK ===================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'منصة محمود منير - Backend API' });
});

// =================== ERROR HANDLER ===================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'خطأ في الخادم' });
});

// =================== CRON JOBS ===================
// حذف أكواد المحاضرات المستخدمة بعد 40 يوم
cron.schedule('0 2 * * *', async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 40);
  await supabase.from('lecture_codes')
    .delete()
    .eq('is_used', true)
    .lt('used_at', cutoff.toISOString());

  // تنظيف online_users القديمة
  const pingCutoff = new Date();
  pingCutoff.setMinutes(pingCutoff.getMinutes() - 5);
  await supabase.from('online_users')
    .delete()
    .lt('last_ping', pingCutoff.toISOString());
});

// =================== START ===================
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
