import React, { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/supabase/client'
import { isTestNumber, normalizePhoneNumber, formatPhoneForDisplay, TWILIO_CONFIG } from '@/utils/twilioConfig'

interface LoginPageProps {
  // Removed onLogin since it's not used
}

export default function LoginPage({}: LoginPageProps = {}) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone')

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const sendOtp = async () => {
    if (authMethod === 'phone') {
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
        // Check if this is a test number
        if (isTestNumber(validPhone)) {
          // For test numbers, simulate OTP sending without actually calling Supabase
          console.log(`Test number detected: ${validPhone}. Using test OTP: ${TWILIO_CONFIG.TEST_OTP}`)
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

        // Try phone authentication for real numbers
        const { error } = await supabase.auth.signInWithOtp({
          phone: validPhone,
          options: {
            shouldCreateUser: true
          }
        })

        if (error) {
          // If phone provider is not supported, show fallback message
          if (error.message.includes('Unsupported phone provider')) {
            toast.error('אימות טלפון לא זמין כעת. אנא השתמש באימות דוא"ל')
            setAuthMethod('email')
            return
          }
          throw error
        }

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
        console.error('Error sending OTP:', error)
        toast.error('שגיאה בשליחת קוד אימות. אנא נסה שוב')
      } finally {
        setIsLoading(false)
      }
    } else {
      // Email authentication
      if (!email.trim()) {
        toast.error('אנא הכנס כתובת דוא"ל')
        return
      }

      if (!validateEmail(email)) {
        toast.error('כתובת דוא"ל לא תקינה')
        return
      }

      setIsLoading(true)
      
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: true
          }
        })

        if (error) {
          throw error
        }

        setIsOtpSent(true)
        toast.success('קוד אימות נשלח לדוא"ל')
        
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
        console.error('Error sending email OTP:', error)
        toast.error('שגיאה בשליחת קוד אימות. אנא נסה שוב')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const resendOtp = async () => {
    setIsOtpSent(false)
    await sendOtp()
    setIsOtpSent(true)
  }

  const verifyOtp = async (token: string) => {
    setIsLoading(true)

    try {
      // Handle test numbers
      if (authMethod === 'phone' && isTestNumber(phone)) {
        if (token === TWILIO_CONFIG.TEST_OTP) {
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
          toast.error(`קוד אימות שגוי. לבדיקות השתמש בקוד: ${TWILIO_CONFIG.TEST_OTP}`)
          return
        }
      }

      let error
      if (authMethod === 'phone') {
        ({ error } = await supabase.auth.verifyOtp({
          phone,
          token: token,
          type: 'sms'
        }))
      } else {
        ({ error } = await supabase.auth.verifyOtp({
          email,
          token: token,
          type: 'email'
        }))
      }

      if (error) {
        throw error
      }

      toast.success('התחברת בהצלחה!')
      // AuthContext will handle the navigation automatically

    } catch (error) {
      console.error('Error verifying OTP:', error)
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
            
            {/* Auth Method Toggle */}
            <div className="flex bg-light-surface rounded-pill p-1 mb-4">
              <button
                onClick={() => setAuthMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-pill text-sm font-medium transition-colors ${
                  authMethod === 'phone' 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                טלפון
              </button>
              <button
                onClick={() => setAuthMethod('email')}
                className={`flex-1 py-2 px-4 rounded-pill text-sm font-medium transition-colors ${
                  authMethod === 'email' 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                דוא"ל
              </button>
            </div>

            {authMethod === 'phone' ? (
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
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-text-primary">כתובת דוא"ל</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full p-3 bg-light-surface border border-gray-300 rounded-design text-text-primary focus:border-primary focus:outline-none"
                  dir="ltr"
                />
                <p className="text-xs text-text-secondary mt-1 text-right">
                  הכנס כתובת דוא"ל תקינה
                </p>
              </div>
            )}

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
                נשלח קוד אימות ל{authMethod === 'phone' ? `מספר ${phone}` : `דוא"ל ${email}`}
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
        )}
      </div>
    </div>
  )
} 