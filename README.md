# 🎓 منصة محمود منير التعليمية

## 🚀 خطوات الديبلوي على Vercel

---

### 1. إعداد قاعدة البيانات (مرة واحدة فقط)

افتح **Supabase → SQL Editor** وألصق محتوى ملف `schema.sql` كاملاً ثم اضغط Run.

أو بعد ديبلوي الـ Backend، افتح في المتصفح:
```
https://your-backend.vercel.app/api/init
```

---

### 2. ديبلوي Backend على Vercel

1. ارفع مجلد `backend` على GitHub
2. اذهب لـ [vercel.com](https://vercel.com) → New Project → استورد الـ repo
3. **Root Directory:** `backend`
4. أضف Environment Variables:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://ysrfgrvewbxaxfzmhkbn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (من ملف .env.example) |
| `JWT_SECRET` | (من ملف .env.example) |
| `FRONTEND_URL` | رابط الفرونتيند بعد ديبلويه |

5. اضغط Deploy

---

### 3. ديبلوي Frontend على Vercel

1. ارفع مجلد `frontend` على GitHub
2. Vercel → New Project → استورد الـ repo
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. أضف Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://ysrfgrvewbxaxfzmhkbn.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (من ملف .env.example) |
| `VITE_API_URL` | رابط الـ Backend على Vercel |

7. اضغط Deploy

---

### 4. Supabase Realtime

في **Supabase Dashboard → Database → Replication**، فعّل Realtime على الجداول:
- `sessions`
- `notifications`
- `online_users`

---

## 🔑 بيانات الدخول الافتراضية

| | |
|--|--|
| **الأدمن الرئيسي** | username: `amr` / password: `123456` |
| **مسار لوحة الأدمن** | `/admin/login` |

---

## 📁 هيكل المشروع

```
educational-platform/
├── schema.sql          ← SQL قاعدة البيانات (الصقه في Supabase)
├── backend/            ← Node.js + Express (ديبلوي على Vercel)
│   ├── index.js
│   ├── supabase.js
│   ├── routes/
│   └── middleware/
└── frontend/           ← React + Vite (ديبلوي على Vercel)
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    └── vercel.json
```

---

## ✅ المميزات المكتملة

### للطالب
- تسجيل دخول بالهاتف أو الإيميل مع "تذكرني"
- لوحة تحكم بالكورسات والقوائم
- نظام أكواد لفتح المحاضرات والامتحانات
- مشغل فيديو مع عداد المشاهدات (15 ثانية + 3 ساعات)
- علامة مائية بإسم الطالب على الفيديو
- امتحانات مع حفظ تلقائي كل 10 ثواني
- إشعارات شخصية وعامة
- ملف شخصي وطلب تغيير كلمة المرور

### للأدمن
- إدارة كاملة للكورسات والقوائم والمحاضرات
- امتحانات بأسئلة متعددة الأنواع (single / multiple / matrix)
- توليد أكواد المحاضرات والامتحانات
- نتائج الطلاب مع مشاركة واتساب
- مراقبة المتصلين في الوقت الفعلي
- إرسال إشعارات (عامة / شخصية / بانر)
- حظر الحسابات والمحتوى
- إدارة الأدمنز مع صلاحيات مخصصة
- إعدادات الموقع (ألوان / روابط / أمان)
- كرة "صنع بواسطة" مع إدارة كاملة
- طرد الجلسات القديمة فوراً عند تسجيل دخول من جهاز جديد
