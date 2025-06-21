import { toast } from 'sonner'
import { supabase } from '../supabase/client'
import { requestContactsPermission, getDeviceContacts, isContactsSupported } from './contactsService'
import { logger } from './logger'
import { validateSMSConfig, SMS_CONFIG } from './twilioConfig'

interface SystemCheckResult {
  component: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export interface SystemTestResult {
  name: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export class SystemTester {
  private results: SystemCheckResult[] = []

  async runFullSystemCheck(): Promise<SystemCheckResult[]> {
    this.results = []
    
    console.log('🚀 מתחיל בדיקת מערכת SafeStatus...')
    
    await this.checkContactsSystem()
    await this.checkSupabaseConnection()
    await this.checkSupabaseTables()
    await this.checkSupabaseRPCFunctions()
    
    this.logResults()
    return this.results
  }

  private async checkContactsSystem(): Promise<void> {
    console.log('👥 בודק מערכת אנשי קשר...')
    
    try {
      // בדיקת תמיכה בפלטפורמה
      const isSupported = isContactsSupported()
      this.addResult('Contacts Platform Support', 
        isSupported ? 'warning' : 'success',
        isSupported ? 'פלטפורמה נטיבית - נדרשות הרשאות' : 'משתמש בנתוני הדמיה'
      )

      // בדיקת בקשת הרשאות
      const permissionResult = await requestContactsPermission()
      this.addResult('Contacts Permission',
        permissionResult.granted ? 'success' : 'error',
        permissionResult.message,
        permissionResult
      )

      // בדיקת קריאת אנשי קשר
      if (permissionResult.granted) {
        const contactsResult = await getDeviceContacts()
        this.addResult('Contacts Reading',
          contactsResult.success ? 'success' : 'error',
          contactsResult.success 
            ? `נמצאו ${contactsResult.contacts?.length || 0} אנשי קשר`
            : contactsResult.error || 'שגיאה לא ידועה',
          contactsResult
        )
      }
    } catch (error) {
      this.addResult('Contacts System', 'error', 
        `שגיאה במערכת אנשי קשר: ${error}`, error)
    }
  }

  private async checkSupabaseConnection(): Promise<void> {
    console.log('🗄️ בודק חיבור Supabase...')
    
    try {
      // בדיקת חיבור בסיסית
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        this.addResult('Supabase Connection', 'error', 
          `שגיאה בחיבור: ${error.message}`, error)
      } else {
        this.addResult('Supabase Connection', 'success', 
          'חיבור תקין ל-Supabase')
      }

      // בדיקת סשן
      const { data: session } = await supabase.auth.getSession()
      this.addResult('Supabase Session', 
        session?.session ? 'success' : 'warning',
        session?.session ? 
          `משתמש מחובר: ${session.session.user?.phone || 'ללא טלפון'}` : 
          'אין משתמש מחובר',
        session
      )

    } catch (error) {
      this.addResult('Supabase Connection', 'error', 
        `שגיאה בחיבור Supabase: ${error}`, error)
    }
  }

  private async checkSupabaseTables(): Promise<void> {
    console.log('📊 בודק טבלאות Supabase...')
    
    const tables = [
      { name: 'users', description: 'טבלת משתמשים' },
      { name: 'user_contacts', description: 'טבלת אנשי קשר של משתמשים' },
      { name: 'contacts', description: 'טבלת קשרים הדדיים' }
    ]

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1)

        if (error) {
          this.addResult(`Table: ${table.name}`, 'error', 
            `שגיאה בטבלה ${table.description}: ${error.message}`, error)
        } else {
          this.addResult(`Table: ${table.name}`, 'success', 
            `${table.description} - זמינה`)
        }
      } catch (error) {
        this.addResult(`Table: ${table.name}`, 'error', 
          `שגיאה בגישה לטבלה ${table.description}: ${error}`, error)
      }
    }
  }

  private async checkSupabaseRPCFunctions(): Promise<void> {
    console.log('⚙️ בודק פונקציות RPC...')
    
    const functions = [
      { 
        name: 'get_mutual_contacts_with_status',
        params: { user_phone_param: '+972500000000' },
        description: 'קבלת אנשי קשר הדדיים עם סטטוס'
      },
      {
        name: 'set_current_user_phone',
        params: { user_phone: '+972500000000' },
        description: 'הגדרת טלפון משתמש נוכחי ל-RLS'
      }
    ]

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func.name, func.params)
        
        if (error) {
          this.addResult(`RPC: ${func.name}`, 'error', 
            `שגיאה בפונקציה ${func.description}: ${error.message}`, error)
        } else {
          this.addResult(`RPC: ${func.name}`, 'success', 
            `${func.description} - זמינה`)
        }
      } catch (error) {
        this.addResult(`RPC: ${func.name}`, 'error', 
          `שגיאה בפונקציה ${func.description}: ${error}`, error)
      }
    }
  }

  private addResult(component: string, status: 'success' | 'error' | 'warning', 
                   message: string, details?: any): void {
    this.results.push({ component, status, message, details })
    
    const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
    console.log(`${icon} ${component}: ${message}`)
    
    // לוג ה-logger המובנה
    if (status === 'error') {
      logger.error(`SystemTest - ${component}`, details)
    } else if (status === 'warning') {
      logger.warn(`SystemTest - ${component}`, details)
    } else {
      logger.info(`SystemTest - ${component}`, details)
    }
  }

  private logResults(): void {
    const successCount = this.results.filter(r => r.status === 'success').length
    const errorCount = this.results.filter(r => r.status === 'error').length
    const warningCount = this.results.filter(r => r.status === 'warning').length
    
    console.log('\n📋 סיכום בדיקת המערכת:')
    console.log(`✅ הצלחות: ${successCount}`)
    console.log(`⚠️ אזהרות: ${warningCount}`)
    console.log(`❌ שגיאות: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('🎉 המערכת תקינה!')
    } else {
      console.log('🔧 נדרש תיקון שגיאות')
    }
  }

  // פונקציה לבדיקה מהדף
  async runQuickCheck(): Promise<void> {
    console.log('🔍 בדיקה מהירה...')
    
    try {
      // בדיקת אנשי קשר
      const contactsResult = await getDeviceContacts()
      if (contactsResult.success) {
        toast.success(`✅ אנשי קשר: ${contactsResult.contacts?.length || 0} נמצאו`)
      } else {
        toast.error(`❌ בעיה באנשי קשר: ${contactsResult.error}`)
      }

      // בדיקת Supabase
      const { error } = await supabase.from('users').select('count').limit(1)
      if (error) {
        toast.error(`❌ בעיה ב-Supabase: ${error.message}`)
      } else {
        toast.success('✅ חיבור Supabase תקין')
      }

    } catch (error) {
      toast.error(`❌ שגיאה בבדיקה: ${error}`)
    }
  }

  getResults(): SystemCheckResult[] {
    return this.results
  }
}

// יצירת instance גלובלי
export const systemTester = new SystemTester()

// פונקציה נוחה לבדיקה מהקונסול
export const runSystemTest = () => systemTester.runFullSystemCheck()
export const quickTest = () => systemTester.runQuickCheck()

export const runSystemTests = async (): Promise<SystemTestResult[]> => {
  const results: SystemTestResult[] = []

  // בדיקת חיבור לSupabase
  try {
    const { error } = await supabase.from('users').select('phone').limit(1)
    if (error) throw error
    
    results.push({
      name: 'Supabase Connection',
      status: 'success',
      message: 'חיבור תקין ל-Supabase'
    })
  } catch (error) {
    results.push({
      name: 'Supabase Connection',
      status: 'error',
      message: 'כשל בחיבור ל-Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // בדיקת הגדרות משתני סביבה
  const envVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]

  for (const envVar of envVars) {
    const value = import.meta.env[envVar]
    results.push({
      name: `Environment Variable: ${envVar}`,
      status: value ? 'success' : 'error',
      message: value ? 'משתנה סביבה קיים' : 'משתנה סביבה חסר',
      details: value ? `Length: ${value.length}` : 'Not set'
    })
  }

  // בדיקת הגדרות SMS
  const smsValidation = validateSMSConfig()
  results.push({
    name: 'SMS Configuration',
    status: smsValidation.isValid ? 'success' : 'error',
    message: smsValidation.isValid ? 
      `הגדרות SMS תקינות (ספק: ${SMS_CONFIG.PROVIDER})` : 
      'הגדרות SMS לא תקינות',
    details: smsValidation.error || `Provider: ${SMS_CONFIG.PROVIDER}`
  })

  // בדיקת גישה לטבלאות
  const tables = ['users', 'contacts', 'user_contacts']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1)
      if (error) throw error
      
      results.push({
        name: `Table Access: ${table}`,
        status: 'success',
        message: `גישה תקינה לטבלה ${table}`
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const status = errorMessage.includes('policy') || errorMessage.includes('RLS') ? 'warning' : 'error'
      
      results.push({
        name: `Table Access: ${table}`,
        status,
        message: status === 'warning' ? 
          `גישה מוגבלת לטבלה ${table} (נדרש אימות)` : 
          `כשל בגישה לטבלה ${table}`,
        details: errorMessage
      })
    }
  }

  // בדיקת RPC functions
  const rpcFunctions = ['get_mutual_contacts_with_status']
  
  for (const funcName of rpcFunctions) {
    try {
      const { error } = await supabase.rpc(funcName, { user_phone_param: '+972542699111' })
      // אם השגיאה היא בגלל RLS אז זה בסדר - הפונקציה קיימת
      if (error && !error.message.includes('policy') && !error.message.includes('RLS')) {
        throw error
      }
      
      results.push({
        name: `RPC Function: ${funcName}`,
        status: 'success',
        message: `פונקציה ${funcName} זמינה`
      })
    } catch (error) {
      results.push({
        name: `RPC Function: ${funcName}`,
        status: 'error',
        message: `פונקציה ${funcName} לא זמינה`,
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // בדיקת גרסת Node/Browser
  results.push({
    name: 'Environment Info',
    status: 'success',
    message: 'מידע על סביבת ההרצה',
    details: `Mode: ${import.meta.env.MODE}, Dev: ${import.meta.env.DEV}`
  })

  return results
}

export const formatTestResults = (results: SystemTestResult[]): string => {
  let output = '🔍 System Test Results:\n\n'
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  output += `✅ Success: ${successCount} | ❌ Errors: ${errorCount} | ⚠️ Warnings: ${warningCount}\n\n`
  
  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
    output += `${icon} ${result.name}: ${result.message}\n`
    if (result.details) {
      output += `   Details: ${result.details}\n`
    }
    output += '\n'
  }
  
  return output
} 