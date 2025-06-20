// Status types
export type UserStatus = 'shelter' | 'safe' | 'none'

// User and Contact types
export interface User {
  phone: string
  status: UserStatus
  last_updated: string
}

export interface Contact {
  user_phone: string
  contact_phone: string
  created_at: string
}

// New: Synced contact from phone
export interface UserContact {
  id: string
  user_phone: string
  contact_name: string
  contact_phone: string
  is_selected: boolean
  synced_at: string
  updated_at: string
}

// Contact with status (for display)
export interface ContactWithStatus extends User {
  name?: string
  is_mutual: boolean
}

// Contact from phone sync (before processing)
export interface PhoneContact {
  name: string
  phoneNumbers: string[]
}

// Log types
export interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
  user_phone?: string
  page?: string
  user_agent?: string
  stack?: string
}

// Auth types
export interface AuthUser {
  phone: string
  isAuthenticated: boolean
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Status update payload
export interface StatusUpdatePayload {
  status: UserStatus
  last_updated: string
}

// Contact request payload
export interface ContactRequestPayload {
  contact_phone: string
}

// Database schema for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'last_updated'> & { last_updated?: string }
        Update: Partial<User>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'created_at'> & { created_at?: string }
        Update: Partial<Contact>
      }
      user_contacts: {
        Row: UserContact
        Insert: Omit<UserContact, 'id' | 'synced_at' | 'updated_at'> & { 
          id?: string
          synced_at?: string
          updated_at?: string
        }
        Update: Partial<UserContact>
      }
      logs: {
        Row: LogEntry
        Insert: Omit<LogEntry, 'timestamp'> & { timestamp?: string }
        Update: Partial<LogEntry>
      }
    }
  }
}

// Utils - Status helpers
export const getStatusText = (status: UserStatus): string => {
  const map: Record<UserStatus, string> = {
    shelter: 'במרחב מוגן',
    safe: 'בטוח', 
    none: 'לא עדכן'
  }
  return map[status]
}

export const getStatusColor = (status: UserStatus): string => {
  const map: Record<UserStatus, string> = {
    shelter: 'text-shelter',
    safe: 'text-safe',
    none: 'text-no-update'
  }
  return map[status]
}

export const groupContactsByStatus = (contacts: ContactWithStatus[]) => ({
  shelter: contacts.filter(c => c.status === 'shelter'),
  safe: contacts.filter(c => c.status === 'safe'),
  none: contacts.filter(c => c.status === 'none')
})

export const formatRelativeTime = (dateString: string): string => {
  const diffMinutes = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60))
  if (diffMinutes < 1) return 'כרגע'
  if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `לפני ${diffHours} שעות`
  return `לפני ${Math.floor(diffHours / 24)} ימים`
}

// Utils - Contact helpers
export const isMutualContact = (userPhone: string, contactPhone: string, allContacts: Contact[]): boolean => {
  const hasUserToContact = allContacts.some(c => c.user_phone === userPhone && c.contact_phone === contactPhone)
  const hasContactToUser = allContacts.some(c => c.user_phone === contactPhone && c.contact_phone === userPhone)
  return hasUserToContact && hasContactToUser
}

export const normalizePhoneNumber = (phone: string): string => phone.replace(/[\s-()]/g, '')

export const isValidIsraeliPhone = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone)
  return /^(\+972|0)(5[0-9]|7[3-9])[0-9]{7}$/.test(normalized)
} 