-- ==========================================
-- EDUCATIONAL PLATFORM - FULL DATABASE SCHEMA
-- منصة محمود منير التعليمية
-- ==========================================
-- الصق هذا في Supabase → SQL Editor
-- أو افتح /api/init في المتصفح بعد الديبلوي

-- ==========================================
-- 1. EXTENSIONS
-- ==========================================
create extension if not exists "pgcrypto";

-- ==========================================
-- 2. ADMINS TABLE
-- ==========================================
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  display_name text,
  parent_admin_id uuid references admins(id) on delete set null,
  permissions jsonb default '{
    "manage_students": true,
    "manage_courses": true,
    "manage_exams": true,
    "manage_codes": true,
    "manage_admins": false,
    "manage_settings": false,
    "view_results": true,
    "manage_notifications": true,
    "manage_bans": true
  }'::jsonb,
  is_super_admin boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Super admin seed
insert into admins (username, password_hash, display_name, is_super_admin)
values ('amr', crypt('123456', gen_salt('bf')), 'المدير الرئيسي', true)
on conflict (username) do nothing;

-- ==========================================
-- 3. GRADES TABLE
-- ==========================================
create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_order int default 0,
  is_active boolean default true,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

insert into grades (name, display_order) values
  ('الأول الثانوي', 1),
  ('الثاني الثانوي', 2),
  ('الثالث الثانوي', 3)
on conflict (name) do nothing;

-- ==========================================
-- 4. STUDENTS TABLE
-- ==========================================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  full_name text not null,
  phone text not null,
  parent_phone text not null,
  email text unique not null,
  password_hash text not null,
  grade_id uuid references grades(id),
  is_active boolean default true,
  ban_until timestamptz,
  ban_reason text,
  default_password text default '123456',
  password_change_requested boolean default false,
  password_change_approved boolean default false,
  password_change_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ==========================================
-- 5. SESSIONS TABLE (single device enforcement)
-- ==========================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  token text unique not null,
  device_info jsonb,
  ip_address text,
  device_type text check (device_type in ('mobile','tablet','desktop')),
  is_active boolean default true,
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- ==========================================
-- 6. COURSES TABLE
-- ==========================================
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_url text,
  grade_id uuid references grades(id),
  is_active boolean default true,
  display_order int default 0,
  created_by uuid references admins(id),
  created_at timestamptz default now(),
  unique(name, grade_id)
);

-- ==========================================
-- 7. PLAYLISTS TABLE
-- ==========================================
create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  name text not null,
  cover_url text,
  grade_id uuid references grades(id),
  display_order int default 0,
  is_active boolean default true,
  created_by uuid references admins(id),
  created_at timestamptz default now(),
  unique(name, course_id)
);

-- ==========================================
-- 8. LECTURES TABLE
-- ==========================================
create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid references playlists(id) on delete cascade,
  grade_id uuid references grades(id),
  title text not null,
  cover_url text,
  video_type text check (video_type in ('youtube','embed','drive','direct')),
  video_url text,
  embed_code text,
  is_free boolean default false,
  view_limit int default 0,
  show_publish_date boolean default false,
  publish_date timestamptz,
  notes text,
  is_active boolean default true,
  display_order int default 0,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

-- ==========================================
-- 9. LECTURE ATTACHMENTS
-- ==========================================
create table if not exists lecture_attachments (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz default now()
);

-- ==========================================
-- 10. LECTURE CODES
-- ==========================================
create table if not exists lecture_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  lecture_id uuid references lectures(id) on delete cascade,
  used_by uuid references students(id),
  used_at timestamptz,
  is_used boolean default false,
  prefix text,
  expires_at timestamptz,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

-- ==========================================
-- 11. STUDENT LECTURE ACCESS
-- ==========================================
create table if not exists student_lecture_access (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  lecture_id uuid references lectures(id) on delete cascade,
  views_remaining int default 0,
  total_views_granted int default 0,
  unlocked_at timestamptz default now(),
  unique(student_id, lecture_id)
);

-- ==========================================
-- 12. WATCH SESSIONS
-- ==========================================
create table if not exists watch_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  lecture_id uuid references lectures(id) on delete cascade,
  started_at timestamptz default now(),
  view_counted_at timestamptz,
  background_timer_started_at timestamptz,
  device_type text,
  ip_address text
);

-- ==========================================
-- 13. EXAMS TABLE
-- ==========================================
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_identifier text unique not null default lpad(floor(random()*99999)::text, 5, '0'),
  grade_id uuid references grades(id),
  playlist_id uuid references playlists(id),
  is_free boolean default false,
  is_hidden boolean default false,
  duration_minutes int not null,
  extra_minutes int default 10,
  max_exits int default 3,
  is_active boolean default true,
  result_mode text check (result_mode in ('instant','scheduled')) default 'instant',
  result_date timestamptz,
  available_from timestamptz,
  available_until timestamptz,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

-- ==========================================
-- 14. QUESTIONS TABLE
-- ==========================================
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references exams(id) on delete cascade,
  question_text text not null,
  image_url text,
  question_type text check (question_type in ('single','multiple','matrix')) default 'single',
  display_order int default 0,
  points int default 1
);

-- ==========================================
-- 15. CHOICES TABLE
-- ==========================================
create table if not exists choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  choice_text text not null,
  is_correct boolean default false,
  matrix_row int,
  display_order int default 0
);

-- ==========================================
-- 16. EXAM CODES
-- ==========================================
create table if not exists exam_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  exam_id uuid references exams(id) on delete cascade,
  used_by uuid references students(id),
  used_at timestamptz,
  is_used boolean default false,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

-- ==========================================
-- 17. EXAM SESSIONS
-- ==========================================
create table if not exists exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  exam_id uuid references exams(id) on delete cascade,
  started_at timestamptz default now(),
  time_remaining_seconds int,
  exits_count int default 0,
  answers jsonb default '{}'::jsonb,
  is_submitted boolean default false,
  submitted_at timestamptz,
  forced_submit boolean default false,
  score numeric(5,2),
  total_points int,
  is_result_visible boolean default false,
  device_type text,
  ip_address text,
  unique(student_id, exam_id)
);

-- ==========================================
-- 18. NOTIFICATIONS TABLE
-- ==========================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  type text check (type in ('global','personal','banner')) default 'personal',
  target_student_id uuid references students(id) on delete cascade,
  is_read boolean default false,
  created_by uuid references admins(id),
  created_at timestamptz default now()
);

-- ==========================================
-- 19. SITE SETTINGS
-- ==========================================
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into site_settings (key, value) values
  ('site_name', '"منصة محمود منير التعليمية"'),
  ('site_logo', 'null'),
  ('block_desktop_watch', 'false'),
  ('desktop_block_app_link', '""'),
  ('theme_colors', '{"primary":"#6c63ff","secondary":"#ff6584","accent":"#43e97b"}'),
  ('social_links', '[{"platform":"whatsapp","url":"","icon":"fab fa-whatsapp"},{"platform":"facebook","url":"","icon":"fab fa-facebook"},{"platform":"instagram","url":"","icon":"fab fa-instagram"},{"platform":"youtube","url":"","icon":"fab fa-youtube"}]'),
  ('made_by_ball', '{"show":true,"label":"صُنع بواسطة عمرو عبد الهادي","balls":[{"icon":"fab fa-facebook","url":"","label":"فيسبوك"},{"icon":"fas fa-globe","url":"","label":"موقعي"}]}'),
  ('watermark_text', '"منصة محمود منير"'),
  ('watermark_image', 'null'),
  ('remember_me_days', '30'),
  ('banner_message', 'null'),
  ('default_password', '"123456"')
on conflict (key) do nothing;

-- ==========================================
-- 20. CONTENT BANS
-- ==========================================
create table if not exists content_bans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  content_type text check (content_type in ('lecture','exam')) not null,
  content_id uuid not null,
  reason text,
  created_by uuid references admins(id),
  created_at timestamptz default now(),
  unique(student_id, content_type, content_id)
);

-- ==========================================
-- 21. ONLINE USERS (real-time presence)
-- ==========================================
create table if not exists online_users (
  student_id uuid primary key references students(id) on delete cascade,
  last_ping timestamptz default now(),
  current_page text,
  device_type text,
  ip_address text
);
