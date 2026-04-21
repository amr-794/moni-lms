const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const deviceDetect = require('../middleware/deviceDetect');
const { requirePermission } = require('../middleware/adminMiddleware');

// GET /api/exams - admin
router.get('/', adminMiddleware, async (req, res) => {
  const { grade_id, playlist_id } = req.query;
  let query = supabase.from('exams').select('*, grades(name), playlists(name)').order('created_at', { ascending: false });
  if (grade_id) query = query.eq('grade_id', grade_id);
  if (playlist_id) query = query.eq('playlist_id', playlist_id);
  const { data } = await query;
  res.json(data || []);
});

// GET /api/exams/student - for students
router.get('/student', authMiddleware, async (req, res) => {
  const { grade_id, playlist_id } = req.query;
  let query = supabase.from('exams').select('id,title,exam_identifier,grade_id,playlist_id,is_free,duration_minutes,available_from,available_until,result_mode,result_date').eq('is_active', true).eq('is_hidden', false).order('created_at', { ascending: false });
  if (grade_id) query = query.eq('grade_id', grade_id);
  if (playlist_id) query = query.eq('playlist_id', playlist_id);
  const { data: exams } = await query;
  if (!exams) return res.json([]);

  const examIds = exams.map(e => e.id);
  const { data: sessions } = await supabase.from('exam_sessions').select('exam_id,is_submitted,score,total_points').eq('student_id', req.student.id).in('exam_id', examIds);
  const { data: bans } = await supabase.from('content_bans').select('content_id').eq('student_id', req.student.id).eq('content_type', 'exam');

  const sessionMap = {};
  (sessions || []).forEach(s => sessionMap[s.exam_id] = s);
  const bannedIds = new Set((bans || []).map(b => b.content_id));

  const result = exams.map(e => ({
    ...e,
    is_banned: bannedIds.has(e.id),
    session: sessionMap[e.id] || null,
    has_access: e.is_free || !!sessionMap[e.id]
  }));

  res.json(result);
});

// POST /api/exams/:id/start
router.post('/:id/start', authMiddleware, deviceDetect, async (req, res) => {
  try {
    const { data: exam } = await supabase.from('exams').select('*, questions(*, choices(*))').eq('id', req.params.id).single();
    if (!exam || !exam.is_active) return res.status(404).json({ error: 'الامتحان غير موجود' });

    const now = new Date();
    if (exam.available_from && new Date(exam.available_from) > now) return res.status(403).json({ error: 'الامتحان لم يبدأ بعد' });
    if (exam.available_until && new Date(exam.available_until) < now) return res.status(403).json({ error: 'انتهى وقت الامتحان' });

    // Check ban
    const { data: ban } = await supabase.from('content_bans').select('id').eq('student_id', req.student.id).eq('content_type', 'exam').eq('content_id', req.params.id).single();
    if (ban) return res.status(403).json({ error: 'تم حظرك من هذا الامتحان' });

    // Check existing session
    const { data: existing } = await supabase.from('exam_sessions').select('*').eq('student_id', req.student.id).eq('exam_id', req.params.id).single();
    if (existing?.is_submitted) return res.status(400).json({ error: 'لقد سبق تسليم هذا الامتحان' });

    if (existing) {
      // Resume
      return res.json({
        session: existing,
        questions: exam.questions.sort((a, b) => a.display_order - b.display_order).map(q => ({
          ...q,
          choices: q.choices.sort((a, b) => a.display_order - b.display_order).map(c => ({ id: c.id, choice_text: c.choice_text, matrix_row: c.matrix_row }))
        })),
        exam: { id: exam.id, title: exam.title, duration_minutes: exam.duration_minutes, extra_minutes: exam.extra_minutes, max_exits: exam.max_exits }
      });
    }

    // New session
    const { data: session } = await supabase.from('exam_sessions').insert({
      student_id: req.student.id,
      exam_id: req.params.id,
      time_remaining_seconds: (exam.duration_minutes + exam.extra_minutes) * 60,
      device_type: req.deviceType,
      ip_address: req.ipAddress
    }).select().single();

    const questions = exam.questions.sort((a, b) => a.display_order - b.display_order).map(q => ({
      ...q,
      choices: q.choices.sort((a, b) => a.display_order - b.display_order).map(c => ({ id: c.id, choice_text: c.choice_text, matrix_row: c.matrix_row }))
    }));

    res.json({
      session,
      questions,
      exam: { id: exam.id, title: exam.title, duration_minutes: exam.duration_minutes, extra_minutes: exam.extra_minutes, max_exits: exam.max_exits }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/exams/:id/session - save progress
router.put('/:id/session', authMiddleware, async (req, res) => {
  try {
    const { answers, time_remaining_seconds, exits_count } = req.body;
    const updates = { answers, time_remaining_seconds };
    if (exits_count !== undefined) updates.exits_count = exits_count;

    const { data: session } = await supabase.from('exam_sessions')
      .update(updates).eq('student_id', req.student.id).eq('exam_id', req.params.id).eq('is_submitted', false).select().single();
    
    if (!session) return res.status(404).json({ error: 'الجلسة غير موجودة' });
    
    // Check if should force submit
    const { data: exam } = await supabase.from('exams').select('max_exits').eq('id', req.params.id).single();
    if (exam && exits_count >= exam.max_exits) {
      return res.json({ force_submit: true, message: 'تجاوزت عدد مرات الخروج المسموح' });
    }

    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exams/:id/submit
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers, forced } = req.body;
    const { data: examSession } = await supabase.from('exam_sessions')
      .select('*').eq('student_id', req.student.id).eq('exam_id', req.params.id).single();
    if (!examSession) return res.status(404).json({ error: 'جلسة الامتحان غير موجودة' });
    if (examSession.is_submitted) return res.status(400).json({ error: 'الامتحان سبق تسليمه' });

    // Get exam with questions and correct answers
    const { data: exam } = await supabase.from('exams').select('*, questions(*, choices(*))').eq('id', req.params.id).single();
    
    let score = 0;
    let totalPoints = 0;
    const answersToScore = answers || examSession.answers;

    exam.questions.forEach(q => {
      totalPoints += q.points;
      const studentAnswer = answersToScore[q.id];
      if (!studentAnswer) return;

      if (q.question_type === 'single') {
        const correct = q.choices.find(c => c.is_correct);
        if (correct && studentAnswer === correct.id) score += q.points;
      } else if (q.question_type === 'multiple') {
        const correctIds = q.choices.filter(c => c.is_correct).map(c => c.id).sort();
        const givenIds = (Array.isArray(studentAnswer) ? studentAnswer : []).sort();
        if (JSON.stringify(correctIds) === JSON.stringify(givenIds)) score += q.points;
      } else if (q.question_type === 'matrix') {
        const rows = [...new Set(q.choices.map(c => c.matrix_row))];
        let allCorrect = true;
        rows.forEach(row => {
          const correct = q.choices.find(c => c.matrix_row === row && c.is_correct);
          if (!correct || studentAnswer[row] !== correct.id) allCorrect = false;
        });
        if (allCorrect) score += q.points;
      }
    });

    const { data: exam_meta } = await supabase.from('exams').select('result_mode').eq('id', req.params.id).single();
    const isResultVisible = exam_meta?.result_mode === 'instant';

    const { data: finalSession } = await supabase.from('exam_sessions').update({
      answers: answersToScore,
      is_submitted: true,
      submitted_at: new Date().toISOString(),
      forced_submit: !!forced,
      score,
      total_points: totalPoints,
      is_result_visible: isResultVisible
    }).eq('id', examSession.id).select().single();

    // Generate submission code (all questions answered)
    const allAnswered = exam.questions.every(q => answersToScore[q.id]);
    const submissionCode = allAnswered ? Math.random().toString(36).substr(2, 8).toUpperCase() : null;

    res.json({
      submitted: true,
      score,
      total_points: totalPoints,
      percentage: totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : 0,
      is_result_visible: isResultVisible,
      submission_code: submissionCode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/exams/:id - admin
router.get('/:id', adminMiddleware, async (req, res) => {
  const { data } = await supabase.from('exams').select('*, questions(*, choices(*)), grades(name), playlists(name)').eq('id', req.params.id).single();
  if (!data) return res.status(404).json({ error: 'غير موجود' });
  res.json(data);
});

// POST /api/exams
router.post('/', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  const { questions, ...examData } = req.body;
  const { data: exam, error } = await supabase.from('exams').insert({ ...examData, created_by: req.admin.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  
  if (questions?.length) {
    for (const q of questions) {
      const { choices, ...qData } = q;
      const { data: question } = await supabase.from('questions').insert({ ...qData, exam_id: exam.id }).select().single();
      if (choices?.length) {
        await supabase.from('choices').insert(choices.map(c => ({ ...c, question_id: question.id })));
      }
    }
  }
  res.status(201).json(exam);
});

// PUT /api/exams/:id
router.put('/:id', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  const { questions, ...examData } = req.body;
  const { data, error } = await supabase.from('exams').update(examData).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/exams/:id
router.delete('/:id', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  await supabase.from('exams').delete().eq('id', req.params.id);
  res.json({ message: 'تم حذف الامتحان' });
});

// Questions management
router.post('/:id/questions', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  const { choices, ...qData } = req.body;
  const { data: question, error } = await supabase.from('questions').insert({ ...qData, exam_id: req.params.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  if (choices?.length) await supabase.from('choices').insert(choices.map(c => ({ ...c, question_id: question.id })));
  res.status(201).json(question);
});

router.put('/questions/:qid', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  const { choices, ...qData } = req.body;
  await supabase.from('questions').update(qData).eq('id', req.params.qid);
  if (choices) {
    await supabase.from('choices').delete().eq('question_id', req.params.qid);
    if (choices.length) await supabase.from('choices').insert(choices.map(c => ({ ...c, question_id: req.params.qid })));
  }
  res.json({ message: 'تم التحديث' });
});

router.delete('/questions/:qid', adminMiddleware, requirePermission('manage_exams'), async (req, res) => {
  await supabase.from('questions').delete().eq('id', req.params.qid);
  res.json({ message: 'تم حذف السؤال' });
});

module.exports = router;
