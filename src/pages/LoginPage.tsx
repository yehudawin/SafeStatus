import React, { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/supabase/client'
import { isTestNumber, normalizePhoneNumber, formatPhoneForDisplay, TWILIO_CONFIG } from '@/utils/twilioConfig'
import { useLogger } from '@/utils/useLogger'

interface LoginPageProps {
  // Removed onLogin since it's not used
}

export default function LoginPage({}: LoginPageProps = {}) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { logInfo, logWarn, logError, logAuth, logUserAction } = useLogger()

  const validatePhone = (phoneNumber: string) => {
    try {
      const normalized = normalizePhoneNumber(phoneNumber)
      // Check if normalization was successful (should start with +972 for Israeli numbers)
      if (normalized.startsWith('+972') && normalized.length === 13) {
        return normalized
      }
      return null
    } catch {
      return null
    }
  }

  const sendOtp = async () => {
    logUserAction('Login: Started OTP request', { phone: phone.substring(0, 3) + '***' })
    
    if (!phone.trim()) {
      logWarn('Login: Empty phone number provided')
      toast.error('אנא הכנס מספר טלפון')
      return
    }

    const validPhone = validatePhone(phone)
    if (!validPhone) {
      logWarn('Login: Invalid phone number format', { phone: phone.substring(0, 3) + '***' })
      toast.error('מספר טלפון לא תקין. הכנס מספר ישראלי (05xxxxxxxx)')
      return
    }

    setIsLoading(true)
    
    try {
      // Check if this is a test number
      if (isTestNumber(validPhone)) {
        logInfo('Login: Test number detected, using test mode', { isTestMode: true })
        if (import.meta.env.DEV) {
          console.log(`Test number detected: ${validPhone}. Using test OTP: ${TWILIO_CONFIG.TEST_OTP}`)
        }
        setIsOtpSent(true)
        setPhone(validPhone)
        toast.success(`קוד אימות נשלח בהודעה ל${formatPhoneForDisplay(validPhone)} (מצב בדיקה)`)
        
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
        return
      }

      logInfo('Login: Sending OTP via Supabase', { phone: validPhone.substring(0, 8) + '***' })
      
      // Try phone authentication for real numbers
      const { error } = await supabase.auth.signInWithOtp({
        phone: validPhone,
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        throw error
      }

      logAuth('OTP sent successfully', { phone: validPhone.substring(0, 8) + '***' })
      setIsOtpSent(true)
      setPhone(validPhone) // Update with formatted phone
      toast.success(`קוד אימות נשלח בהודעה ל${formatPhoneForDisplay(validPhone)}`)
      
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
      logError('Login: Failed to send OTP', error)
      if (import.meta.env.DEV) {
        console.error('Error sending OTP:', error)
      }
      toast.error('שגיאה בשליחת קוד אימות. אנא נסה שוב')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    setIsOtpSent(false)
    await sendOtp()
    setIsOtpSent(true)
  }

  const verifyOtp = async (token: string) => {
    logUserAction('Login: Started OTP verification', { tokenLength: token.length })
    setIsLoading(true)

    try {
      // Handle test numbers
      if (isTestNumber(phone)) {
        if (token === TWILIO_CONFIG.TEST_OTP) {
          logAuth('Login: Test OTP verified successfully', { isTestMode: true })
          
          // For test numbers, create a manual session
          const testUser = {
            id: 'test-user-' + Date.now(),
            phone: phone,
            email: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_confirmed_at: null,
            phone_confirmed_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString()
          }
          
          // Set a mock session in localStorage for test mode
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            user: testUser,
            expires_at: Date.now() + 3600000 // 1 hour
          }))
          
          toast.success('התחברת בהצלחה! (מצב בדיקה)')
          
          // Trigger auth state change by reloading
          window.location.reload()
          return
        } else {
          logWarn('Login: Invalid test OTP provided', { providedToken: token })
          toast.error(`קוד אימות שגוי. לבדיקות השתמש בקוד: ${TWILIO_CONFIG.TEST_OTP}`)
          return
        }
      }

      logInfo('Login: Verifying OTP with Supabase')
      
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: token,
        type: 'sms'
      })

      if (error) {
        throw error
      }

      logAuth('Login: OTP verified successfully', { phone: phone.substring(0, 8) + '***' })
      toast.success('התחברת בהצלחה!')
      // AuthContext will handle the navigation automatically

    } catch (error) {
      logError('Login: OTP verification failed', error)
      if (import.meta.env.DEV) {
        console.error('Error verifying OTP:', error)
      }
      toast.error('קוד אימות שגוי. אנא נסה שוב')
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
    
    // Automatically verify when 6 digits are entered
    if (value.length === 6) {
      verifyOtp(value)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* App Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">SafeStatus</h1>
          <p className="text-text-secondary">עדכון מצב במצבי חירום</p>
        </div>

        {!isOtpSent ? (
          /* Login Input Screen */
          <div className="card-design">
            <h2 className="text-xl font-semibold mb-4 text-center text-text-primary">התחברות</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-text-primary">מספר טלפון</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="05X-XXX-XXXX"
                className="w-full p-3 bg-light-surface border border-gray-300 rounded-design text-text-primary text-right focus:border-primary focus:outline-none"
                dir="ltr"
              />
              <p className="text-xs text-text-secondary mt-1 text-right">
                הכנס מספר טלפון ישראלי תקין
              </p>
            </div>

            <button
              onClick={sendOtp}
              disabled={isLoading}
              className="button-primary w-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'שולח...' : 'שלח קוד אימות'}
            </button>

            <div className="mt-4 text-xs text-text-secondary text-center">
              בלחיצה על "שלח קוד אימות" אתה מסכים לתנאי השימוש ו
              <a href="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</a>
            </div>
          </div>
        ) : (
          /* OTP Verification Screen */
          <div className="card-design">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-2 text-text-primary">הכנס קוד אימות</h2>
              <p className="text-text-secondary text-sm">
                נשלח קוד אימות למספר {phone}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-text-primary">קוד אימות</label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="123456"
                className="w-full p-3 bg-light-surface border border-gray-300 rounded-design text-text-primary text-center text-2xl tracking-widest focus:border-primary focus:outline-none"
                maxLength={6}
                dir="ltr"
              />
            </div>

            <button
              onClick={() => verifyOtp(otp)}
              disabled={isLoading || otp.length !== 6}
              className="button-primary w-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mb-3 transition-colors"
            >
              {isLoading ? 'מאמת...' : 'אמת קוד'}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-text-secondary">
                  ניתן לשלוח קוד חדש בעוד {countdown} שניות
                </p>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoading) {
                      resendOtp()
                    }
                  }}
                  disabled={isLoading}
                  className="text-primary text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  שלח קוד אימות חדש
                </button>
              )}
            </div>
          </div>
        )        }
      </div>
    </div>
  )
} 