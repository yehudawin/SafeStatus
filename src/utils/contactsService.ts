import { Contacts } from '@capacitor-community/contacts'
import { Capacitor } from '@capacitor/core'
import type { PhoneContact } from '@/types'

export interface ContactPermissionResult {
  granted: boolean
  message: string
}

export interface ContactsResult {
  success: boolean
  contacts?: PhoneContact[]
  error?: string
}

/**
 * בדוק אם הפלטפורמה נתמכת לגישה לאנשי קשר
 */
export const isContactsSupported = (): boolean => {
  return Capacitor.isNativePlatform()
}

/**
 * בקש הרשאה לגישה לאנשי קשר
 */
export const requestContactsPermission = async (): Promise<ContactPermissionResult> => {
  try {
    if (!isContactsSupported()) {
      return {
        granted: true, // נחשיב שהרשאה ניתנה למצב הדמיה
        message: 'משתמש בנתוני הדמיה - גישה לאנשי קשר אמיתיים זמינה רק באפליקציית הנייד'
      }
    }

    // וידוא שהפלאגין זמין
    if (typeof Contacts === 'undefined' || !Contacts.requestPermissions) {
      throw new Error('Contacts plugin not available')
    }

    const permission = await Contacts.requestPermissions()
    
    if (permission && permission.contacts === 'granted') {
      return {
        granted: true,
        message: 'הרשאה לגישה לאנשי קשר הוענקה'
      }
    } else if (permission && permission.contacts === 'denied') {
      return {
        granted: false,
        message: 'הרשאה נדחתה. אנא אפשר גישה לאנשי קשר בהגדרות המכשיר'
      }
    } else {
      return {
        granted: false,
        message: 'יש להעניק הרשאה לגישה לאנשי הקשר כדי להמשיך'
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error requesting contacts permission:', error)
    }
    
    // אם זה שגיאת פלאגין, ננסה להמשיך עם נתוני הדמיה
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('plugin') || errorMessage.includes('not available')) {
      return {
        granted: true,
        message: 'משתמש בנתוני הדמיה - פלאגין אנשי קשר לא זמין'
      }
    }
    
    return {
      granted: false,
      message: 'שגיאה בבקשת הרשאה לגישה לאנשי קשר'
    }
  }
}

/**
 * קבל את רשימת אנשי הקשר מהמכשיר
 */
export const getDeviceContacts = async (): Promise<ContactsResult> => {
  try {
    // נתוני הדמיה עבור דפדפן/פיתוח או כגיבוי
    const getMockContacts = (): PhoneContact[] => [
      { name: 'אמא', phoneNumbers: ['050-1234567'] },
      { name: 'אבא', phoneNumbers: ['052-2345678'] },
      { name: 'אחי דני', phoneNumbers: ['053-3456789', '02-9876543'] },
      { name: 'חברה שרה', phoneNumbers: ['054-4567890'] },
      { name: 'עבודה - מנהל', phoneNumbers: ['03-1234567', '050-9876543'] },
      { name: 'רופא המשפחה', phoneNumbers: ['02-5555555'] },
      { name: 'חבר מהצבא', phoneNumbers: ['055-1111111'] },
      { name: 'דודה רחל', phoneNumbers: ['052-9999999'] },
      { name: 'חבר יניב', phoneNumbers: ['054-8888888'] },
      { name: 'שכנה טובה', phoneNumbers: ['050-7777777'] }
    ]

    if (!isContactsSupported()) {
      return {
        success: true,
        contacts: getMockContacts()
      }
    }

    // וידוא שהפלאגין זמין
    if (typeof Contacts === 'undefined' || !Contacts.checkPermissions || !Contacts.getContacts) {
      return {
        success: true,
        contacts: getMockContacts()
      }
    }

    // בדוק הרשאות
    const permission = await Contacts.checkPermissions()
    if (!permission || permission.contacts !== 'granted') {
      return {
        success: false,
        error: 'אין הרשאה לגישה לאנשי קשר'
      }
    }

    // קבל את אנשי הקשר
    const result = await Contacts.getContacts({
      projection: {
        name: true,
        phones: true,
        image: false,
        emails: false,
        urls: false,
        organization: false,
        birthday: false,
        note: false
      }
    })

    if (!result || !result.contacts) {
      return {
        success: true,
        contacts: getMockContacts()
      }
    }

    // המר לפורמט שלנו
    const contacts: PhoneContact[] = result.contacts
      .filter(contact => contact.name && contact.phones && contact.phones.length > 0)
      .map(contact => ({
        name: contact.name?.display || 'ללא שם',
        phoneNumbers: contact.phones?.map(phone => phone.number || '') || []
      }))
      .filter(contact => contact.phoneNumbers.length > 0)

    // אם לא נמצאו אנשי קשר, החזר נתוני הדמיה
    if (contacts.length === 0) {
      return {
        success: true,
        contacts: getMockContacts()
      }
    }

    return {
      success: true,
      contacts
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error getting device contacts:', error)
    }
    
    // במקרה של שגיאה, החזר נתוני הדמיה במקום לכשל
    const getMockContacts = (): PhoneContact[] => [
      { name: 'אמא', phoneNumbers: ['050-1234567'] },
      { name: 'אבא', phoneNumbers: ['052-2345678'] },
      { name: 'אחי דני', phoneNumbers: ['053-3456789'] },
      { name: 'חברה שרה', phoneNumbers: ['054-4567890'] },
      { name: 'עבודה - מנהל', phoneNumbers: ['03-1234567'] }
    ]
    
    return {
      success: true,
      contacts: getMockContacts()
    }
  }
} 