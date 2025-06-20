# מדריך מערכת הלוגים - SafeStatus (גרסה פשוטה)

## סקירה כללית

מערכת לוגים פשוטה ויעילה לפיתוח ובדיקות. המערכת עובדת רק במצב פיתוח ושומרת לוגים מקומיים שניתן לנתח.

## מאפיינים

✅ לוגים במצב פיתוח בלבד  
✅ שמירה מקומית בדפדפן  
✅ יצוא לוגים לקבצים  
✅ תפיסה אוטומטית של שגיאות  
✅ לוגינג מאובטח (הסתרת מספרי טלפון)  
✅ ניקוי אוטומטי של לוגים ישנים  

## שימוש בקוד

### ייבוא ה-Hook
```typescript
import { useLogger } from '@/utils/useLogger'

const { logInfo, logWarn, logError, logUserAction, logApiCall, logAuth } = useLogger()
```

### דוגמאות שימוש
```typescript
// לוג רגיל
logInfo('המשתמש נכנס לעמוד הראשי')

// לוג עם נתונים נוספים
logUserAction('עדכון סטטוס', { status: 'safe', method: 'manual' })

// לוג שגיאה
logError('שגיאה בשמירת נתונים', error)

// לוג קריאת API
logApiCall('POST /api/status', { success: true, responseTime: 250 })

// לוג אוטנטיקציה
logAuth('Login successful', { phone: '+972542***' })
```

## גישה ללוגים

### דרך Developer Console

1. פתח Developer Tools (F12)
2. עבור לטאב Console
3. הקלד את הפקודות הבאות:

```javascript
// קבלת רשימת התאריכים עם לוגים
window.logger.getLogDates()

// קבלת לוגים של יום מסוים
window.logger.getFileLogsForDate('2024-01-15')

// יצוא לוגים של יום מסוים
window.logger.exportFileLogsForDate('2024-01-15')

// יצוא כל הלוגים
window.logger.exportAllFileLogs()

// ניקוי לוגים ישנים (מעל 7 ימים)
window.logger.cleanOldFileLogs(7)
```

## מבנה קובץ לוג

כל שורת לוג כוללת:
```
[15/01/2024, 14:30:25] [INFO] [User: +972542***] [HomePage] כניסה לעמוד הראשי
Data: {"page": "home", "timestamp": "2024-01-15T14:30:25.123Z"}
--------------------------------------------------------------------------------
```

### מבנה הנתונים:
- **זמן**: תאריך ושעה בשעון ישראל
- **רמה**: INFO / WARN / ERROR
- **משתמש**: מספר טלפון מוסתר חלקית
- **עמוד**: העמוד בו אירע הלוג
- **הודעה**: טקסט הלוג
- **נתונים**: JSON עם מידע נוסף (אם יש)

## ניהול לוגים

### ניקוי אוטומטי
המערכת מנקה אוטומטית לוגים מעל 7 ימים.

### ניקוי ידני
```javascript
// ניקוי לוגים מעל X ימים
window.logger.cleanOldFileLogs(3) // מעל 3 ימים

// מחיקת כל הלוגים
localStorage.clear()
```

### גודל אחסון
LocalStorage מוגבל לכ-10MB. במקרה של מילוי יתר:
1. המערכת תציג אזהרה
2. ניתן לנקות לוגים ישנים
3. ניתן לייצא לוגים לפני מחיקה

## דיבאגינג ופיתוח

### הפעלת מצב verbose
```javascript
// במצב פיתוח - הצגת כל הלוגים
window.logger.config.logLevel = 'info'

// רק שגיאות ואזהרות
window.logger.config.logLevel = 'warn'
```

### בדיקת מצב המערכת
```javascript
// הצגת הגדרות הלוגר
console.log(window.logger.config)

// הצגת מספר לוגים
console.log(window.logger.getLocalLogs().length)

// הצגת שגיאות אחרונות
console.log(window.logger.getRecentErrors(5))
```

## שגיאות נפוצות

### LocalStorage מלא
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage'
```
**פתרון**: נקה לוגים ישנים או ייצא לקבצים

### אין גישה ללוגים
**בדיקה**: המערכת פועלת רק במצב פיתוח (`npm run dev`)

### לוגים לא נשמרים
**בדיקה**: ודא שהדפדפן תומך ב-LocalStorage ושהוא לא במצב פרטי

## טיפים לפיתוח

1. **השתמש בקטגוריות מתאימות**:
   - `logInfo` - מידע כללי
   - `logUserAction` - פעולות משתמש
   - `logApiCall` - קריאות API
   - `logAuth` - אוטנטיקציה
   - `logError` - שגיאות

2. **הסתר מידע רגיש**:
   ```typescript
   logInfo('User logged in', { 
     phone: user.phone.substring(0, 8) + '***' 
   })
   ```

3. **ייצא לוגים לפני פרסום**:
   ייצא את הלוגים מסביבת הפיתוח לפני העלאה לייצור

4. **נטר גודל אחסון**:
   בדוק מדי פעם את גודל הלוגים במצב פיתוח

## דוגמא מלאה

```typescript
import React, { useEffect } from 'react'
import { useLogger } from '@/utils/useLogger'

export function HomePage() {
  const { logInfo, logUserAction, logError } = useLogger()

  useEffect(() => {
    logInfo('HomePage loaded')
  }, [])

  const handleStatusUpdate = async (status: string) => {
    try {
      logUserAction('Update status started', { status })
      // API call here...
      logUserAction('Update status completed', { status, success: true })
    } catch (error) {
      logError('Failed to update status', error)
    }
  }

  return (
    // JSX...
  )
}
```

זוהי המערכת הפשוטה והיעילה שתעזור לך לעקוב אחר פעילות המערכת ולאתר בעיות במצב פיתוח! 