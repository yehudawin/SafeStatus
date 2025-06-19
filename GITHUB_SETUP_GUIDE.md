# 🚀 מדריך הגדרת GitHub Actions לבניית APK

## 📋 שלב 1: הגדרת Secrets ב-GitHub

לאחר יצירת חשבון Twilio, תצטרך להגדיר את ה-Secrets הבאים ב-GitHub:

### 🔐 איך להגדיר Secrets:

1. **כנס לפרויקט ב-GitHub**: https://github.com/yehudawin/SafeStatus
2. **לחץ על Settings** (בתפריט העליון)
3. **בצד שמאל, לחץ על "Secrets and variables"** ← **"Actions"**
4. **לחץ על "New repository secret"**

### 📝 Secrets נדרשים:

#### Supabase (כבר קיימים):
```
VITE_SUPABASE_URL = https://avjuwnpuprutycsmyiar.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Twilio (להוסיף לאחר יצירת חשבון):
```
VITE_TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN = your_auth_token_here
VITE_TWILIO_PHONE_NUMBER = +1234567890
```

#### חתימה דיגיטלית (אופציונלי - לגרסת Release):
```
SIGNING_KEY_ALIAS = your_key_alias
SIGNING_KEY_PASSWORD = your_key_password
SIGNING_STORE_PASSWORD = your_store_password
```

---

## 🏗️ שלב 2: בניית APK

### 🔄 בנייה אוטומטית:
**GitHub Action רץ אוטומטית** בכל push ל-main ובונה APK debug.

### 🎯 בנייה ידנית:

1. **כנס לפרויקט ב-GitHub**
2. **לחץ על "Actions"** (בתפריט העליון)
3. **בחר "Build Android APK"**
4. **לחץ על "Run workflow"**
5. **בחר סוג בנייה**:
   - **Debug** - לבדיקות (ברירת מחדל)
   - **Release** - לפרסום (דורש חתימה דיגיטלית)
6. **לחץ על "Run workflow"**

### 📁 הורדת APK:

1. **המתן לסיום הבנייה** (כ-5-10 דקות)
2. **לחץ על ה-workflow שהסתיים**
3. **בחלק "Artifacts"** הורד את הקובץ:
   - `safestatus-debug-apk` - גרסת debug
   - `safestatus-release-apk` - גרסת release

---

## 📱 שלב 3: התקנת APK

### 🔧 הכנה:
1. **בטלפון Android**: הגדרות ← אבטחה ← אפשר "מקורות לא ידועים"
2. **העבר את APK** לטלפון (דרך דוא"ל/USB/ענן)

### 📲 התקנה:
1. **לחץ על קובץ APK** בטלפון
2. **אשר התקנה**
3. **פתח את האפליקציה**

---

## 🌟 יתרונות GitHub Actions:

- ✅ **בנייה אוטומטית** בכל עדכון קוד
- ✅ **סביבת בנייה נקייה** בכל פעם
- ✅ **גיבוי** של כל גרסאות APK
- ✅ **חתימה דיגיטלית** אוטומטית
- ✅ **יצירת Releases** אוטומטית

---

## 🎯 הפעלת בדיקה מהירה:

**למספר הבדיקה שלך (0542699111):**
1. הכנס את המספר
2. השתמש בקוד: **123456**
3. התחבר בהצלחה!

---

## 📧 קבלת פרטי Twilio:

לאחר יצירת חשבון ב-Twilio:

1. **היכנס ל-Console**: https://console.twilio.com
2. **Account SID**: נמצא ב-Dashboard הראשי
3. **Auth Token**: לחץ על "View" ליד Auth Token
4. **Phone Number**: רכוש מספר חדש ב-Phone Numbers ← Buy a number

---

## 🆘 פתרון בעיות:

### ❌ אם הבנייה נכשלת:
1. בדוק שכל הSecrets הוגדרו נכון
2. ודא שהתחביר תקין (ללא רווחים מיותרים)
3. בדוק שמפתחות Supabase עדיין תקינים

### ❌ אם APK לא מתקין:
1. ודא שאישרת "מקורות לא ידועים"
2. נסה להתקין דרך File Manager במקום דפדפן
3. אתחל את הטלפון ונסה שוב

### ❌ אם האפליקציה קורסת:
1. בדוק שהחיבור לאינטרנט תקין
2. ודא שמפתחות Supabase תקינים
3. נסה לנקות cache של האפליקציה

---

**🎉 בהצלחה! האפליקציה שלך תהיה מוכנה ב-APK תוך דקות ספורות.** 