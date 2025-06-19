import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/')}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">מדיניות פרטיות</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 text-gray-300 leading-relaxed">
        
        {/* Introduction */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">מבוא</h2>
          <p>
            SafeStatus ("אנחנו", "שלנו", "האפליקציה") מחויבת להגן על הפרטיות שלך. 
            מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך 
            כאשר אתה משתמש באפליקציית SafeStatus.
          </p>
        </section>

        {/* Information We Collect */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">מידע שאנו אוספים</h2>
          
          <h3 className="text-lg font-medium text-emerald-400 mb-3">מידע אישי:</h3>
          <ul className="space-y-2 mr-4">
            <li>• מספר טלפון (לצורך אימות והתחברות)</li>
            <li>• סטטוס חירום שלך ("נכנס למקלט" / "חזר לרגיל")</li>
            <li>• רשימת אנשי קשר שבחרת לשתף איתם (שמות ומספרי טלפון)</li>
          </ul>

          <h3 className="text-lg font-medium text-emerald-400 mb-3 mt-6">מידע טכני:</h3>
          <ul className="space-y-2 mr-4">
            <li>• כתובת IP (לצורך אבטחה בלבד)</li>
            <li>• זמני שימוש באפליקציה</li>
            <li>• נתוני שגיאות לצורך תיקון תקלות</li>
          </ul>
        </section>

        {/* How We Use Information */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">כיצד אנו משתמשים במידע</h2>
          
          <ul className="space-y-2 mr-4">
            <li>• <strong>אימות זהות:</strong> להבטיח שרק אתה יכול לגשת לחשבון שלך</li>
            <li>• <strong>שירות העדכונים:</strong> לאפשר לך לעדכן סטטוס ולראות סטטוס של אחרים</li>
            <li>• <strong>ניהול אנשי קשר:</strong> להציג רק מידע מאנשים שבחרתם הדדית לשתף</li>
            <li>• <strong>אבטחה:</strong> למנוע שימוש לרעה באפליקציה</li>
            <li>• <strong>שיפור השירות:</strong> לתקן תקלות ולשפר את חווית המשתמש</li>
          </ul>
        </section>

        {/* Data Sharing */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">שיתוף מידע</h2>
          
          <div className="bg-emerald-900/30 border border-emerald-600/50 p-4 rounded-lg mb-4">
            <p className="text-emerald-400 font-medium">
              🔒 אנו <strong>לא</strong> מוכרים, משתפים או מעבירים את המידע האישי שלך לצדדים שלישיים.
            </p>
          </div>

          <p>המידע שלך נשאר פרטי וזמין רק:</p>
          <ul className="space-y-2 mr-4 mt-3">
            <li>• לך אישית</li>
            <li>• לאנשי קשר שבחרתם <strong>הדדית</strong> לשתף איתם מידע</li>
            <li>• למערכות האבטחה שלנו (באופן אוטומטי ומוצפן)</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">אבטחת מידע</h2>
          
          <p className="mb-4">אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך:</p>
          
          <ul className="space-y-2 mr-4">
            <li>• <strong>הצפנה:</strong> כל הנתונים מוצפנים בהעברה ובאחסון</li>
            <li>• <strong>אימות דו-שלבי:</strong> OTP (קוד חד-פעמי) לכניסה לחשבון</li>
            <li>• <strong>RLS (Row Level Security):</strong> בסיס נתונים מאובטח</li>
            <li>• <strong>HTTPS:</strong> חיבור מוצפן לכל העברת המידע</li>
            <li>• <strong>גיבויים:</strong> גיבוי מידע רגיל במערכות מאובטחות</li>
          </ul>
        </section>

        {/* User Rights */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">הזכויות שלך</h2>
          
          <p className="mb-4">יש לך זכויות מלאות על המידע שלך:</p>
          
          <ul className="space-y-2 mr-4">
            <li>• <strong>גישה:</strong> לראות את כל המידע שלנו יש עליך</li>
            <li>• <strong>עדכון:</strong> לשנות או לתקן מידע אישי</li>
            <li>• <strong>מחיקה:</strong> למחוק את החשבון והמידע שלך לחלוטין</li>
            <li>• <strong>הגבלה:</strong> להפסיק שיתוף עם אנשי קשר מסוימים</li>
            <li>• <strong>ייצוא:</strong> להוריד עותק של כל המידע שלך</li>
          </ul>

          <div className="bg-blue-900/30 border border-blue-600/50 p-4 rounded-lg mt-4">
            <p className="text-blue-400">
              📧 ליצירת קשר בנושא הזכויות שלך: <strong>privacy@safestatus.app</strong>
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">שמירת מידע</h2>
          
          <ul className="space-y-2 mr-4">
            <li>• <strong>חשבון פעיל:</strong> המידע נשמר כל עוד החשבון פעיל</li>
            <li>• <strong>חשבון לא פעיל:</strong> מידע נמחק אוטומטית לאחר 12 חודשי חוסר פעילות</li>
            <li>• <strong>מחיקת חשבון:</strong> מידע נמחק תוך 30 יום מבקשת המחיקה</li>
            <li>• <strong>נתוני גיבוי:</strong> נמחקים לאחר 90 יום</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">עוגיות (Cookies)</h2>
          
          <p className="mb-4">
            האפליקציה משתמשת בטכנולוגיות אחסון מקומי (לא cookies מסורתיים) רק לצרכים טכניים:
          </p>
          
          <ul className="space-y-2 mr-4">
            <li>• שמירת מפתח ההתחברות (לתקופה מוגבלת)</li>
            <li>• העדפות תצוגה (ערכת נושא, גודל טקסט)</li>
            <li>• cache לביצועים טובים יותר</li>
          </ul>
        </section>

        {/* Changes to Policy */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">שינויים במדיניות</h2>
          
          <p className="mb-4">
            מדיניות פרטיות זו עלולה להתעדכן מעת לעת. במקרה של שינויים מהותיים:
          </p>
          
          <ul className="space-y-2 mr-4">
            <li>• נשלח התראה דרך האפליקציה</li>
            <li>• נשלח הודעת SMS (אם התקבלה הסכמה)</li>
            <li>• תופיע הודעה בפתיחה הבאה של האפליקציה</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">יצירת קשר</h2>
          
          <p className="mb-4">לשאלות, הצעות או חששות בנושא פרטיות:</p>
          
          <div className="bg-gray-700 p-4 rounded-lg space-y-2">
            <p>📧 <strong>אימייל:</strong> privacy@safestatus.app</p>
            <p>🌐 <strong>אתר:</strong> https://safestatus.vercel.app</p>
            <p>📱 <strong>טלפון:</strong> נשמח לעזור דרך האפליקציה</p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 pt-8 border-t border-gray-700">
          {/* מומלץ לעדכן תאריך זה באופן ידני בעת שינוי מהותי במדיניות */}
          <p>מדיניות פרטיות זו עודכנה לאחרונה: 29 ביולי 2024</p>
          <p className="mt-2">SafeStatus © 2024 - כל הזכויות שמורות</p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPage; 