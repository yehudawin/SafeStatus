// Twilio Configuration
export const TWILIO_CONFIG = {
  // Test numbers that should bypass actual SMS sending
  TEST_NUMBERS: [
    '+972542699111', // המספר שלך
    '+9720542699111', // וריאציה
    '0542699111' // פורמט מקומי
  ],
  
  // Default test OTP for test numbers
  TEST_OTP: '123456',
  
  // Twilio settings (will be set via environment variables)
  ACCOUNT_SID: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
  AUTH_TOKEN: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
  PHONE_NUMBER: import.meta.env.VITE_TWILIO_PHONE_NUMBER
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
  const normalizedPhone = normalizePhoneNumber(phone)
  return TWILIO_CONFIG.TEST_NUMBERS.some(testNumber => {
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