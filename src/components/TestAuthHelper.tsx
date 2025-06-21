import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/supabase/client'
import { runSystemTests, type SystemTestResult } from '@/utils/systemTest'
import { validateSMSConfig, SMS_CONFIG } from '@/utils/twilioConfig'

export default function TestAuthHelper() {
  const [isTestingRealAuth, setIsTestingRealAuth] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('+972542699111')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [systemTests, setSystemTests] = useState<SystemTestResult[]>([])
  const [showSystemTests, setShowSystemTests] = useState(false)
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const { user, signOut } = useAuth()

  // פונקציה לוולידציה של מספר טלפון ישראלי
  const validateIsraeliPhone = (phone: string) => {
    // הסר רווחים ומקפים
    const cleaned = phone.replace(/[\s-]/g, '')
    
    // בדוק פורמטים נפוצים לישראל
    const patterns = [
      /^\+972[2-9]\d{8}$/, // +972XXXXXXXXX
      /^972[2-9]\d{8}$/, // 972XXXXXXXXX
      /^0[2-9]\d{8}$/, // 0XXXXXXXXX
    ]
    
    return patterns.some(pattern => pattern.test(cleaned))
  }

  // פונקציה לנירמול מספר לפורמט בינלאומי
  const normalizePhone = (phone: string) => {
    let cleaned = phone.replace(/[\s-]/g, '')
    
    if (cleaned.startsWith('0')) {
      cleaned = '+972' + cleaned.substring(1)
    } else if (cleaned.startsWith('972')) {
      cleaned = '+' + cleaned
    } else if (!cleaned.startsWith('+972')) {
      cleaned = '+972' + cleaned
    }
    
    return cleaned
  }

  // פונקציה לנסות אימות אמיתי מהיר
  const tryRealAuth = async () => {
    setIsTestingRealAuth(true)
    
    try {
      // בדיקת תקינות מספר הטלפון
      if (!validateIsraeliPhone(phoneNumber)) {
        toast.error('מספר הטלפון לא תקין. השתמש בפורמט: +972XXXXXXXXX או 0XXXXXXXXX')
        return
      }
      
      const normalizedPhone = normalizePhone(phoneNumber)
      setPhoneNumber(normalizedPhone) // עדכון המספר המנורמל
      
      toast.info(`שולח SMS ל-${normalizedPhone}...`)
      console.log(`Attempting to send SMS to: ${normalizedPhone}`)
      
      // ננסה להתחבר עם מספר הטלפון המנורמל
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
      })
      
      if (error) {
        console.error('Real auth failed:', error)
        toast.error(`אימות אמיתי נכשל: ${error.message}`)
        
        // לוגינג מפורט לאבחון VONAGE
        if (error.message.includes('SMS') || error.message.includes('phone')) {
          toast.info('💡 בדוק: הגדרות VONAGE בדשבורד Supabase, מספר הטלפון תקין?', {
            duration: 8000
          })
        }
        
        // אם נכשל, ננסה לקבוע את ה-RLS context באופן ידני
        try {
          await supabase.rpc('set_current_user_phone', {
            user_phone: phoneNumber
          })
          toast.success('הגדרת RLS הצליחה ידנית')
        } catch (rlsError) {
          console.error('Manual RLS set failed:', rlsError)
          toast.error('גם הגדרת RLS ידנית נכשלה')
        }
      } else {
        toast.success(`SMS נשלח ל-${phoneNumber}! בדוק את הטלפון שלך`)
        console.log(`SMS sent successfully to: ${phoneNumber}`)
      }
    } catch (error) {
      console.error('Auth attempt failed:', error)
      toast.error(`שגיאה: ${error}`)
    } finally {
      setIsTestingRealAuth(false)
    }
  }

  // פונקציה לבדיקת הסטטוס הנוכחי
  const checkCurrentAuth = async () => {
    try {
      const { data: session } = await supabase.auth.getSession()
      console.log('Current Supabase session:', session)
      
      const testSession = localStorage.getItem('supabase.auth.token')
      console.log('Current test session:', testSession ? JSON.parse(testSession) : null)
      
      // בדיקת RLS
      try {
        const { data, error } = await supabase.rpc('set_current_user_phone', {
          user_phone: user?.phone || '+972542699111'
        })
        
        if (error) {
          toast.error(`RLS לא עובד: ${error.message}`)
          console.error('RLS error details:', error)
        } else {
          toast.success('RLS עובד תקין!')
          console.log('RLS set successfully:', data)
        }
      } catch (error) {
        toast.error(`שגיאה בבדיקת RLS: ${error}`)
        console.error('RLS check failed:', error)
      }
      
    } catch (error) {
      toast.error(`שגיאה בבדיקת אימות: ${error}`)
    }
  }

  // פונקציה מיוחדת לתיקון RLS
  const fixRlsIssue = async () => {
    try {
      toast.info('מנסה לתקן בעיית RLS...')
      
      // נסה קודם להכניס משתמש לטבלת users
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', user?.phone || '+972542699111')
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        // המשתמש לא קיים, ננסה ליצור
        console.log('Creating user in users table...')
        const { error: createError } = await supabase
          .from('users')
          .insert({
            phone: user?.phone || '+972542699111',
            status: 'none',
            verified: false,
            join_date: new Date().toISOString(),
            last_updated: new Date().toISOString()
          })
        
        if (createError) {
          console.error('Failed to create user:', createError)
          toast.error(`נכשל ביצירת משתמש: ${createError.message}`)
        } else {
          toast.success('משתמש נוצר בהצלחה!')
          
          // עכשיו ננסה את RLS
          const { error: rlsError } = await supabase.rpc('set_current_user_phone', {
            user_phone: user?.phone || '+972542699111'
          })
          
          if (rlsError) {
            toast.error(`RLS עדיין לא עובד: ${rlsError.message}`)
          } else {
            toast.success('RLS תוקן!')
          }
        }
      } else if (existingUser) {
        console.log('User exists:', existingUser)
        toast.info('המשתמש כבר קיים, מנסה RLS...')
        
        const { error: rlsError } = await supabase.rpc('set_current_user_phone', {
          user_phone: user?.phone || '+972542699111'
        })
        
        if (rlsError) {
          toast.error(`RLS לא עובד: ${rlsError.message}`)
        } else {
          toast.success('RLS עובד!')
        }
      }
      
    } catch (error) {
      console.error('Fix RLS failed:', error)
      toast.error(`נכשל בתיקון: ${error}`)
    }
  }

  // פונקציה לבדיקת הגדרות SMS/VONAGE
  const checkSmsConfig = async () => {
    try {
      toast.info('בודק הגדרות SMS...')
      
      // בדיקת משתני סביבה
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      console.log('Environment check:')
      console.log('SUPABASE_URL:', supabaseUrl ? '✅ מוגדר' : '❌ חסר')
      console.log('ANON_KEY:', anonKey ? '✅ מוגדר' : '❌ חסר')
      
      if (!supabaseUrl || !anonKey) {
        toast.error('חסרים משתני סביבה בקובץ .env')
        return
      }
      
      // ננסה לשלוח SMS לטלפון פיקטיבי כדי לבדוק הגדרות
      toast.info('מנסה שליחת SMS בדיקה...')
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+972500000000', // טלפון פיקטיבי לבדיקה
      })
      
      if (error) {
        console.error('SMS config test failed:', error)
        
        if (error.message.includes('Invalid phone number')) {
          toast.warning('VONAGE מוגדר אבל יש בעיה בפורמט הטלפון')
        } else if (error.message.includes('SMS') || error.message.includes('phone')) {
          toast.error('❌ VONAGE לא מוגדר נכון בדשבורד Supabase')
          setTimeout(() => {
            toast.info('💡 בדוק: Authentication > Settings > SMS Auth Provider ב-Supabase', {
              duration: 8000
            })
          }, 1000)
        } else {
          toast.error(`שגיאה לא ידועה: ${error.message}`)
        }
      } else {
        toast.success('✅ הגדרות SMS נראות תקינות!')
      }
      
    } catch (error) {
      console.error('SMS config check failed:', error)
      toast.error(`שגיאה בבדיקת הגדרות: ${error}`)
    }
  }

  // פונקציה לניסיון הוספת נתונים
  const testDataInsert = async () => {
    try {
      toast.info('מנסה הוספת נתוני בדיקה...')
      
      const { data, error } = await supabase
        .from('user_contacts')
        .insert({
          user_phone: user?.phone || '+972542699111',
          contact_name: 'בדיקה',
          contact_phone: '+972500000000',
          is_selected: false
        })
        .select()

      if (error) {
        console.error('Test insert failed:', error)
        toast.error(`הוספת נתונים נכשלה: ${error.message}`)
      } else {
        console.log('Test insert succeeded:', data)
        toast.success('הוספת נתונים הצליחה!')
        
        // מחק את רשומת הבדיקה
        await supabase
          .from('user_contacts')
          .delete()
          .eq('user_phone', user?.phone || '+972542699111')
          .eq('contact_name', 'בדיקה')
      }
    } catch (error) {
      toast.error(`שגיאה: ${error}`)
    }
  }

  const runSystemCheck = async () => {
    setLoading(true)
    try {
      const results = await runSystemTests()
      setSystemTests(results)
      setShowSystemTests(true)
      
      const errorCount = results.filter(r => r.status === 'error').length
      if (errorCount > 0) {
        setMessage(`⚠️ נמצאו ${errorCount} בעיות במערכת. בדוק את הפרטים למטה.`)
      } else {
        setMessage('✅ כל בדיקות המערכת עברו בהצלחה!')
      }
    } catch (error) {
      setMessage(`❌ שגיאה בבדיקת המערכת: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const checkSMSConfig = () => {
    const validation = validateSMSConfig()
    if (validation.isValid) {
      setMessage(`✅ הגדרות SMS תקינות. ספק פעיל: ${SMS_CONFIG.PROVIDER}`)
    } else {
      setMessage(`❌ הגדרות SMS לא תקינות: ${validation.error}`)
    }
  }

  if (!import.meta.env.DEV) {
    return null // רק במצב פיתוח
  }

  return (
    <div className="fixed bottom-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs z-50">
      <h4 className="text-sm font-medium text-blue-800 mb-2">🔧 כלי פיתוח - אימות</h4>
      
      <div className="text-xs text-blue-700 mb-2">
        {user ? `מחובר: ${user.phone || 'ללא טלפון'}` : 'לא מחובר'}
      </div>
      
      {showPhoneInput && (
        <div className="mb-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="מספר טלפון (+972...)"
            className="w-full px-2 py-1 text-xs border border-blue-300 rounded"
            dir="ltr"
          />
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        <button
          onClick={checkCurrentAuth}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          בדוק סטטוס אימות
        </button>
        
        <button
          onClick={() => setShowPhoneInput(!showPhoneInput)}
          className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
        >
          📞 {showPhoneInput ? 'הסתר טלפון' : 'שנה טלפון'}
        </button>
        
        <button
          onClick={tryRealAuth}
          disabled={isTestingRealAuth}
          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
        >
          {isTestingRealAuth ? 'שולח SMS...' : `📱 שלח SMS ל-${phoneNumber.slice(-4)}`}
        </button>
        
        <button
          onClick={testDataInsert}
          className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
        >
          בדוק הוספת נתונים
        </button>
        
        <button
          onClick={fixRlsIssue}
          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
        >
          🔧 תקן RLS
        </button>
        
        <button
          onClick={checkSmsConfig}
          className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
        >
          📲 בדוק SMS/VONAGE
        </button>
        
        <button
          onClick={signOut}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          התנתק
        </button>
      </div>

      {/* System Tests Section */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={runSystemCheck}
            disabled={loading}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'בודק...' : 'בדיקת מערכת מלאה'}
          </button>
          <button
            onClick={checkSMSConfig}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            בדיקת הגדרות SMS
          </button>
        </div>
        
        {showSystemTests && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-semibold mb-2">תוצאות בדיקת מערכת:</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {systemTests.map((test, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded ${
                    test.status === 'success' ? 'bg-green-100 text-green-800' :
                    test.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  <div className="font-medium">
                    {test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⚠️'}
                    {' '}{test.name}
                  </div>
                  <div className="text-sm">{test.message}</div>
                  {test.details && (
                    <div className="text-xs opacity-75 mt-1">{test.details}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Environment Info */}
      <div className="p-3 bg-blue-50 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">מידע על הסביבה:</h4>
        <div className="text-sm space-y-1">
          <div>מצב: {import.meta.env.MODE}</div>
          <div>פיתוח: {import.meta.env.DEV ? 'כן' : 'לא'}</div>
          <div>ספק SMS: {SMS_CONFIG.PROVIDER}</div>
          <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ קיים' : '❌ חסר'}</div>
          <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ קיים' : '❌ חסר'}</div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded ${
          message.includes('✅') ? 'bg-green-100 text-green-800' :
          message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
} 