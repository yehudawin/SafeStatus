import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface LoginPageProps {
  onLogin: (phone: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { mockLogin } = useAuth()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const validatePhone = (phoneNumber: string) => {
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Check if it's a valid Israeli phone number
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return `+972${cleaned.substring(1)}`
    }
    if (cleaned.length === 13 && cleaned.startsWith('972')) {
      return `+${cleaned}`
    }
    if (cleaned.length === 12 && cleaned.startsWith('9725')) {
      return `+${cleaned}`
    }
    
    return null
  }

  const sendOtp = async () => {
    if (!phone.trim()) {
      toast.error('אנא הכנס מספר טלפון')
      return
    }

    const validPhone = validatePhone(phone)
    if (!validPhone) {
      toast.error('מספר טלפון לא תקין. הכנס מספר ישראלי (05xxxxxxxx)')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: validPhone,
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        throw error
      }

      setIsOtpSent(true)
      setPhone(validPhone) // Update with formatted phone
      toast.success('קוד אימות נשלח בהודעה')
      
      // Start countdown
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (error) {
      console.error('Error sending OTP:', error)
      toast.error('שגיאה בשליחת קוד אימות. במצב פיתוח - השתמש בקוד 123456')
      
      // For development mode, allow continuing with mock OTP
      setIsOtpSent(true)
      setPhone(validPhone) // Update with formatted phone
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('אנא הכנס קוד אימות')
      return
    }

    if (otp.length !== 6) {
      toast.error('קוד אימות חייב להכיל 6 ספרות')
      return
    }

    setIsLoading(true)

    try {
      // In development mode, allow mock OTP
      if (otp === '123456') {
        // Simulate successful login for development
        toast.success('התחברת בהצלחה! (מצב פיתוח)')
        
        // Create user in database if doesn't exist
        await supabase.from('users').upsert({ 
          phone, 
          status: 'none', 
          last_updated: new Date().toISOString() 
        })
        
        // Set RLS context
        await supabase.rpc('set_current_user_phone', { user_phone: phone })
        
        // Create a mock user session for testing
        await mockLogin(phone)
        return
      }

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        throw error
      }

      toast.success('התחברת בהצלחה!')
      onLogin(phone)

    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error('קוד אימות שגוי. במצב פיתוח - השתמש בקוד 123456')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow only digits, spaces, hyphens, and plus
    const cleaned = value.replace(/[^\d\s\-+]/g, '')
    setPhone(cleaned)
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* App Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SafeStatus</h1>
          <p className="text-gray-400">עדכון מצב במצבי חירום</p>
        </div>

        {/* Development Mode Notice */}
        <div className="bg-amber-900/20 border border-amber-600 rounded-lg p-3 mb-4 text-amber-300 text-sm text-center">
          מצב פיתוח: השתמש בקוד 123456 לאימות
        </div>

        {!isOtpSent ? (
          /* Phone Input Screen */
          <div className="bg-dark-surface rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">התחברות</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">מספר טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="05X-XXX-XXXX"
                className="w-full p-3 bg-dark-card border border-gray-600 rounded-lg text-white text-right focus:border-blue-500 focus:outline-none"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                הכנס מספר טלפון ישראלי תקין
              </p>
            </div>

            <button
              onClick={sendOtp}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'שולח...' : 'שלח קוד אימות'}
            </button>

            <div className="mt-4 text-xs text-gray-400 text-center">
              בלחיצה על "שלח קוד אימות" אתה מסכים לתנאי השימוש ו
              <a href="/privacy" className="text-blue-400 hover:underline">מדיניות הפרטיות</a>
            </div>
          </div>
        ) : (
          /* OTP Verification Screen */
          <div className="bg-dark-surface rounded-lg p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-2">הכנס קוד אימות</h2>
              <p className="text-gray-400 text-sm">
                נשלח קוד אימות למספר {phone}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">קוד אימות</label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="123456"
                className="w-full p-3 bg-dark-card border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
                maxLength={6}
                dir="ltr"
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {isLoading ? 'מאמת...' : 'אמת קוד'}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-400">
                  ניתן לשלוח קוד חדש בעוד {countdown} שניות
                </p>
              ) : (
                <button
                  onClick={() => {
                    setIsOtpSent(false)
                    setOtp('')
                  }}
                  className="text-blue-400 text-sm hover:underline"
                >
                  שלח קוד אימות חדש
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 