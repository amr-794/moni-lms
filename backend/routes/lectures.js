const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const deviceDetect = require('../middleware/deviceDetect');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/lectures - for admin
router.get('/', adminMiddleware, async (req, res) => {
  const { playlist_id } = req.query;
  let query = supabase.from('lectures').select('*, playlists(name,courses(name)), lecture_attachments(*)').order('display_order');
  if (playlist_id) query = query.eq('playlist_id', playlist_id);
  const { data } = await query;
  res.json(data || []);
});

// GET /api/lectures/student - for student
router.get('/student', authMiddleware, async (req, res) => {
  const { playlist_id } = req.query;
  let query = supabase.from('lectures').select('*, lecture_attachments(*)').eq('is_active', true).order('display_order');
  if (playlist_id) query = query.eq('playlist_id', playlist_id);
  const { data: lectures } = await query;
  if (!lectures) return res.json([]);

  const lectureIds = lectures.map(l => l.id);
  const { data: access } = await supabase.from('student_lecture_access')
    .select('*').eq('student_id', req.student.id).in('lecture_id', lectureIds);
  
  const { data: bans } = await supabase.from('content_bans')
    .select('content_id').eq('student_id', req.student.id).eq('content_type', 'lecture');
  
  const accessMap = {};
  (access || []).forEach(a => accessMap[a.lecture_id] = a);
  const bannedIds = new Set((bans || []).map(b => b.content_id));

  const result = lectures.map(l => ({
    ...l,
    video_url: undefined, // don't expose until verified
    is_banned: bannedIds.has(l.id),
    access: accessMap[l.id] || null,
    has_access: l.is_free || !!accessMap[l.id]
  }));

  res.json(result);
});

// GET /api/lectures/:id/watch - get video URL for watching
router.get('/:id/watch', authMiddleware, deviceDetect, async (req, res) => {
  try {
    const { data: lecture } = await supabase.from('lectures').select('*').eq('id', req.params.id).single();
    if (!lecture || !lecture.is_active) return res.status(404).json({ error: 'المحاضرة غير موجودة' });

    // Check desktop block
    const { data: blockSetting } = await supabase.from('site_settings').select('value').eq('key', 'block_desktop_watch').single();
    const blockDesktop = blockSetting?.value === true || blockSetting?.value === 'true';
    if (blockDesktop && req.deviceType === 'desktop') {
      return res.status(403).json({ error: 'المشاهدة من الكمبيوتر غير متاحة', code: 'DESKTOP_BLOCKED' });
    }

    // Check ban
    const { data: ban } = await supabase.from('content_bans')
      .select('id').eq('student_id', req.student.id).eq('content_type', 'lecture').eq('content_id', req.params.id).single();
    if (ban) return res.status(403).json({ error: 'تم حظرك من هذه المحاضرة' });

    // Check access
    if (!lecture.is_free) {
      const { data: access } = await supabase.from('student_lecture_access')
        .select('*').eq('student_id', req.student.id).eq('lecture_id', req.params.id).single();
      if (!access) return res.status(403).json({ error: 'يجب استخدام كود لفتح هذه المحاضرة', code: 'NO_ACCESS' });
      if (access.views_remaining <= 0) return res.status(403).json({ error: 'استنفدت عدد المشاهدات المتاحة', code: 'NO_VIEWS' });
    }

    // Create watch session
    const { data: watchSession } = await supabase.from('watch_sessions').insert({
      student_id: req.student.id,
      lecture_id: req.params.id,
      device_type: req.deviceType,
      ip_address: req.ipAddress
    }).select().single();

    res.json({
      lecture: {
        id: lecture.id,
        title: lecture.title,
        video_type: lecture.video_type,
        video_url: lecture.video_url,
        embed_code: lecture.embed_code,
        notes: lecture.notes,
      },
      watch_session_id: watchSession.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lectures/:id/view-count - called after 15 seconds
router.post('/:id/view-count', authMiddleware, async (req, res) => {
  try {
    const { watch_session_id } = req.body;
    
    // Mark view as counted in watch session
    await supabase.from('watch_sessions').update({ view_counted_at: new Date().toISOString() })
      .eq('id', watch_session_id).eq('student_id', req.student.id);

    // Decrease views_remaining
    const { data: access } = await supabase.from('student_lecture_access')
      .select('*').eq('student_id', req.student.id).eq('lecture_id', req.params.id).single();
    
    if (access && access.views_remaining > 0) {
      await supabase.from('student_lecture_access')
        .update({ views_remaining: access.views_remaining - 1 })
        .eq('id', access.id);
    }

    res.json({ message: 'تم احتساب المشاهدة', views_remaining: access ? access.views_remaining - 1 : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lectures/:id/background-view - called after 3 hours
router.post('/:id/background-view', authMiddleware, async (req, res) => {
  try {
    const { watch_session_id } = req.body;
    await supabase.from('watch_sessions').update({ background_timer_started_at: new Date().toISOString() })
      .eq('id', watch_session_id).eq('student_id', req.student.id);

    const { data: access } = await supabase.from('student_lecture_access')
      .select('*').eq('student_id', req.student.id).eq('lecture_id', req.params.id).single();
    
    if (access && access.views_remaining > 0) {
      await supabase.from('student_lecture_access')
        .update({ views_remaining: access.views_remaining - 1 }).eq('id', access.id);
    }

    res.json({ message: 'تم احتساب المشاهدة الخلفية', reload: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lectures/:id - admin
router.get('/:id', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('lectures').select('*, lecture_attachments(*)').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'غير موجود' });
  res.json(data);
});

// POST /api/lectures
router.post('/', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { playlist_id, grade_id, title, cover_url, video_type, video_url, embed_code, is_free, view_limit, notes, display_order, show_publish_date, publish_date, attachments } = req.body;
  const { data, error } = await supabase.from('lectures').insert({
    playlist_id, grade_id, title, cover_url, video_type, video_url, embed_code, is_free, view_limit, notes, display_order, show_publish_date, publish_date, created_by: req.admin.id
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  
  if (attachments?.length) {
    await supabase.from('lecture_attachments').insert(attachments.map(a => ({ ...a, lecture_id: data.id })));
  }
  res.status(201).json(data);
});

// PUT /api/lectures/:id
router.put('/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  const { attachments, ...lectureData } = req.body;
  const { data, error } = await supabase.from('lectures').update(lectureData).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  
  if (attachments !== undefined) {
    await supabase.from('lecture_attachments').delete().eq('lecture_id', req.params.id);
    if (attachments.length) {
      await supabase.from('lecture_attachments').insert(attachments.map(a => ({ ...a, lecture_id: req.params.id })));
    }
  }
  res.json(data);
});

// DELETE /api/lectures/:id
router.delete('/:id', adminMiddleware, requirePermission('manage_courses'), async (req, res) => {
  await supabase.from('lectures').delete().eq('id', req.params.id);
  res.json({ message: 'تم حذف المحاضرة' });
});

// GET /api/lectures/:id/access - admin view who has access
router.get('/:id/access', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('student_lecture_access')
    .select('*, students(full_name, student_code, phone)').eq('lecture_id', req.params.id);
  res.json(data || []);
});

module.exports = router;
