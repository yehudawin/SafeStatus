// SMS Providers Configuration
export type SMSProvider = 'twilio' | 'vonage'

export const SMS_CONFIG = {
  // בחירת ספק SMS מתוך משתני הסביבה
  PROVIDER: (import.meta.env.VITE_SMS_PROVIDER || 'twilio') as SMSProvider,
  
  // Test numbers that should bypass actual SMS sending (only in development)
  TEST_NUMBERS: import.meta.env.DEV ? [
    '+972542699111', // המספר שלך - רק במצב פיתוח
    '+9720542699111', // וריאציה
    '0542699111' // פורמט מקומי
  ] : [],
  
  // Default test OTP for test numbers (only in development)
  TEST_OTP: import.meta.env.DEV ? '123456' : '',
  
  // Twilio settings
  TWILIO: {
    ACCOUNT_SID: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
    PHONE_NUMBER: import.meta.env.VITE_TWILIO_PHONE_NUMBER
  },
  
  // Vonage settings
  VONAGE: {
    API_KEY: import.meta.env.VITE_VONAGE_API_KEY,
    API_SECRET: import.meta.env.VITE_VONAGE_API_SECRET,
    PHONE_NUMBER: import.meta.env.VITE_VONAGE_PHONE_NUMBER
  }
}

// Backward compatibility - DEPRECATED: השתמש ב-SMS_CONFIG במקום
export const TWILIO_CONFIG = {
  TEST_NUMBERS: SMS_CONFIG.TEST_NUMBERS,
  TEST_OTP: SMS_CONFIG.TEST_OTP,
  ACCOUNT_SID: SMS_CONFIG.TWILIO.ACCOUNT_SID,
  AUTH_TOKEN: SMS_CONFIG.TWILIO.AUTH_TOKEN,
  PHONE_NUMBER: SMS_CONFIG.TWILIO.PHONE_NUMBER
}

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Convert Israeli phone to international format
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `+972${cleaned.substring(1)}`
  }
  if (cleaned.length === 13 && cleaned.startsWith('972')) {
    return `+${cleaned}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('9725')) {
    return `+${cleaned}`
  }
  
  return phone
}

export const isTestNumber = (phone: string): boolean => {
  // במצב ייצור, אין מספרי בדיקה
  if (!import.meta.env.DEV) return false
  
  const normalizedPhone = normalizePhoneNumber(phone)
  return SMS_CONFIG.TEST_NUMBERS.some(testNumber => {
    const normalizedTestNumber = normalizePhoneNumber(testNumber)
    return normalizedPhone === normalizedTestNumber
  })
}

export const formatPhoneForDisplay = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone)
  if (normalized.startsWith('+972')) {
    const localNumber = '0' + normalized.substring(4)
    return localNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }
  return phone
}

// פונקציה לבדיקת הגדרות ספק SMS הנבחר
export const validateSMSConfig = (): { isValid: boolean; error?: string } => {
  const provider = SMS_CONFIG.PROVIDER
  
  if (provider === 'twilio') {
    const { ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER } = SMS_CONFIG.TWILIO
    if (!ACCOUNT_SID || !AUTH_TOKEN || !PHONE_NUMBER) {
      return {
        isValid: false,
        error: 'Twilio configuration is incomplete. Check VITE_TWILIO_* environment variables.'
      }
    }
  } else if (provider === 'vonage') {
    const { API_KEY, API_SECRET, PHONE_NUMBER } = SMS_CONFIG.VONAGE
    if (!API_KEY || !API_SECRET || !PHONE_NUMBER) {
      return {
        isValid: false,
        error: 'Vonage configuration is incomplete. Check VITE_VONAGE_* environment variables.'
      }
    }
  } else {
    return {
      isValid: false,
      error: `Unknown SMS provider: ${provider}. Set VITE_SMS_PROVIDER to 'twilio' or 'vonage'.`
    }
  }
  
  return { isValid: true }
}

// פונקציה להחזרת הגדרות הספק הנבחר
export const getActiveSMSConfig = () => {
  const provider = SMS_CONFIG.PROVIDER
  
  if (provider === 'twilio') {
    return {
      provider: 'twilio' as const,
      config: SMS_CONFIG.TWILIO
    }
  } else if (provider === 'vonage') {
    return {
      provider: 'vonage' as const,
      config: SMS_CONFIG.VONAGE
    }
  }
  
  throw new Error(`Invalid SMS provider: ${provider}`)
} 