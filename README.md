# 🚨 SafeStatus - אפליקציית סטטוס חירום

**אפליקציה לעדכון וצפייה בסטטוס חירום של אנשי קשר הדדיים**

## 📱 מה זה SafeStatus?

SafeStatus היא אפליקציית PWA המאפשרת למשתמשים:
- 🛡️ **עדכון סטטוס חירום** - "נכנסתי למקלט" / "חזרתי לשגרה" 
- 👥 **צפייה בסטטוס חברים** - רק של אנשי קשר שבחרו הדדית לשתף
- 📱 **סנכרון אנשי קשר** - מהטלפון עם בחירה סלקטיבית
- 🔒 **פרטיות מלאה** - מערכת הרשאות דו-כיוונית

---

## 🛠️ טכנולוגיות:

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Build**: Vite + PWA Plugin
- **UI**: RTL Hebrew Support + Dark Theme
- **Mobile**: PWA עם Service Worker

## 🚀 התקנה והפעלה:

```bash
# התקנת dependencies
npm install

# הפעלה לפיתוח
npm run dev

# בניה לפרודקשן
npm run build

# תצוגה מקדימה
npm run preview
```

## 🔐 הגדרת Supabase:

1. צור פרויקט ב-[Supabase](https://supabase.com)
2. העתק `env.example` ל-`.env` ועדכן את הפרטים
3. או עדכן ישירות ב-`src/supabase/client.ts`
4. מסד הנתונים מוגדר אוטומטית עם RLS

## 📱 מצבי אימות:

- **Production**: OTP אמיתי דרך Supabase
- **Development**: קוד קבוע `123456` לבדיקות

---

## 🚀 פרסום:

### Vercel/Netlify (מומלץ):
```bash
# דחוף לGitHub
git add .
git commit -m "SafeStatus v1.0 - Ready for production"
git push

# פרסם בVercel/Netlify (חיבור אוטומטי מGitHub)
```

### Google Play Store:
1. פרסם כ-PWA באינטרנט תחילה
2. צור TWA (Trusted Web Activity) 
3. העלה לGoogle Play Console

## 📊 ביצועים:

- **גודל**: 337KB gzipped
- **זמן טעינה**: <2 שניות  
- **PWA Score**: 90+
- **תמיכה**: כל הדפדפנים המודרניים

---

## 📄 License

MIT License - ראה קובץ LICENSE לפרטים

## 🤝 תרומה

Pull Requests מתקבלים בברכה! לפני תרומה, אנא פתח Issue לדיון.

**🚀 SafeStatus - בטיחות במצבי חירום דרך שיתוף מידע מבוקר ופרטי** 