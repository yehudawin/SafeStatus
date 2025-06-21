import { createClient } from '@supabase/supabase-js'
import type { Database, User, Contact, UserStatus, ApiResponse, ContactWithStatus, UserContact, PhoneContact } from '@/types'

// וידוא שמשתני הסביבה קיימים
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Direct API functions
export const updateUserStatus = async (phone: string, status: UserStatus): Promise<ApiResponse<User>> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`Attempting to update status for ${phone} to ${status}`)
    }

    // First ensure user exists
    const userCheck = await getUserByPhone(phone)
    if (!userCheck.success) {
      if (import.meta.env.DEV) {
        console.log(`User ${phone} doesn't exist, creating...`)
      }
      
      // Create user if doesn't exist
      const { error: createError } = await supabase
        .from('users')
        .insert({ 
          phone, 
          status: 'none',
          last_updated: new Date().toISOString(),
          verified: false,
          join_date: new Date().toISOString()
        })

      if (createError) {
        if (import.meta.env.DEV) {
          console.error('Failed to create user:', createError)
        }
        throw createError
      }
    }

    // Now update the status
    const { data, error } = await supabase
      .from('users')
      .update({ status, last_updated: new Date().toISOString() })
      .eq('phone', phone)
      .select()
      .single()

    if (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to update status:', error)
      }
      throw error
    }
    
    if (import.meta.env.DEV) {
      console.log(`Successfully updated status for ${phone} to ${status}`)
    }
    
    return { data, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update status'
    
    if (import.meta.env.DEV) {
      console.error('updateUserStatus error:', error)
    }
    
    // נתן מידע מפורט יותר על השגיאה
    let detailedMessage = errorMessage
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      detailedMessage = 'בעיית הרשאות - אנא התחבר מחדש או השתמש באימות אמיתי'
    } else if (errorMessage.includes('42501') || errorMessage.includes('violates row-level security policy')) {
      detailedMessage = 'בעיית הרשאות RLS - אנא השתמש באימות אמיתי דרך SMS'
    } else if (errorMessage.includes('policy')) {
      detailedMessage = 'בעיית הרשאות מסד נתונים - אנא התחבר מחדש'
    } else if (errorMessage.includes('network')) {
      detailedMessage = 'בעיית חיבור לאינטרנט'
    } else if (errorMessage.includes('auth')) {
      detailedMessage = 'בעיית אימות - אנא התחבר מחדש'
    }
    
    return { error: detailedMessage, success: false }
  }
}

export const getUserByPhone = async (phone: string): Promise<ApiResponse<User>> => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('phone', phone).single()
    if (error) throw error
    return { data, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'User not found', success: false }
  }
}

export const addContact = async (userPhone: string, contactPhone: string): Promise<ApiResponse<Contact>> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert({ user_phone: userPhone, contact_phone: contactPhone })
      .select()
      .single()

    if (error) throw error
    return { data, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to add contact', success: false }
  }
}

export const removeContact = async (userPhone: string, contactPhone: string): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_phone', userPhone)
      .eq('contact_phone', contactPhone)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to remove contact', success: false }
  }
}

export const isContactExists = async (userPhone: string, contactPhone: string): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('user_phone')
      .eq('user_phone', userPhone)
      .eq('contact_phone', contactPhone)
      .maybeSingle()

    if (error) throw error
    return { data: !!data, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to check contact', success: false }
  }
}

export const getMutualContacts = async (userPhone: string): Promise<ApiResponse<User[]>> => {
  try {
    // Use the RPC function to get mutual contacts
    const { data, error } = await supabase.rpc('get_mutual_contacts_with_status', { 
      user_phone_param: userPhone 
    })
    if (error) throw error
    return { data: data || [], success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get contacts', success: false }
  }
}

export const getAllUserContacts = async (userPhone: string): Promise<ApiResponse<ContactWithStatus[]>> => {
  try {
    // Get all contacts added by this user
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_phone')
      .eq('user_phone', userPhone)

    if (contactsError) throw contactsError

    if (!contactsData || contactsData.length === 0) {
      return { data: [], success: true }
    }

    // Get user details for each contact
    const contactPhones = contactsData.map(c => c.contact_phone)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('phone, status, last_updated')
      .in('phone', contactPhones)

    if (usersError) throw usersError

    // Get mutual contacts to check which ones are mutual
    const mutualResult = await getMutualContacts(userPhone)
    const mutualPhones = mutualResult.success && mutualResult.data ? 
      new Set(mutualResult.data.map(u => u.phone)) : new Set()

    // Combine the data
    const contactsWithStatus: ContactWithStatus[] = (usersData || []).map(user => ({
      phone: user.phone,
      name: user.phone, // For now use phone as name
      status: user.status as UserStatus,
      last_updated: user.last_updated,
      is_mutual: mutualPhones.has(user.phone)
    }))

    return { data: contactsWithStatus, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get all contacts', success: false }
  }
}

// User Contacts (synced from phone) functions
export const syncPhoneContacts = async (userPhone: string, contacts: PhoneContact[]): Promise<ApiResponse<UserContact[]>> => {
  try {
    if (import.meta.env.DEV) {
      console.log(`syncPhoneContacts: Starting sync for ${userPhone} with ${contacts.length} contacts`)
    }

    // Clear existing contacts first
    const { error: deleteError } = await supabase
      .from('user_contacts')
      .delete()
      .eq('user_phone', userPhone)

    if (deleteError && import.meta.env.DEV) {
      console.warn('syncPhoneContacts: Error deleting existing contacts (might be expected if none exist):', deleteError)
    }

    // Prepare contacts for insertion
    const contactsToInsert = contacts.flatMap(contact => 
      contact.phoneNumbers.map(phone => ({
        user_phone: userPhone,
        contact_name: contact.name,
        contact_phone: phone,
        is_selected: false // Default to not selected
      }))
    )

    if (import.meta.env.DEV) {
      console.log(`syncPhoneContacts: Inserting ${contactsToInsert.length} contact records`)
    }

    const { data, error } = await supabase
      .from('user_contacts')
      .insert(contactsToInsert)
      .select()

    if (error) {
      if (import.meta.env.DEV) {
        console.error('syncPhoneContacts: Insert failed:', error)
      }
      throw error
    }
    
    if (import.meta.env.DEV) {
      console.log(`syncPhoneContacts: Successfully inserted ${data?.length || 0} records`)
    }
    
    return { data: data || [], success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync contacts'
    
    if (import.meta.env.DEV) {
      console.error('syncPhoneContacts: Failed with error:', error)
    }
    
    // נתן מידע מפורט יותר על השגיאה
    let detailedMessage = errorMessage
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      detailedMessage = 'בעיית הרשאות - אנא התחבר מחדש'
    } else if (errorMessage.includes('policy')) {
      detailedMessage = 'בעיית הרשאות מסד נתונים - אנא התחבר מחדש'
    } else if (errorMessage.includes('network')) {
      detailedMessage = 'בעיית חיבור לאינטרנט'
    }
    
    return { error: detailedMessage, success: false }
  }
}

export const getUserContacts = async (userPhone: string): Promise<ApiResponse<UserContact[]>> => {
  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_phone', userPhone)
      .order('contact_name')

    if (error) throw error
    return { data: data || [], success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get user contacts', success: false }
  }
}

export const updateContactSelection = async (contactId: string, isSelected: boolean): Promise<ApiResponse<UserContact>> => {
  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .update({ is_selected: isSelected })
      .eq('id', contactId)
      .select()
      .single()

    if (error) throw error
    return { data, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update contact selection', success: false }
  }
}

export const getSelectedContacts = async (userPhone: string): Promise<ApiResponse<UserContact[]>> => {
  try {
    const { data, error } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('is_selected', true)
      .order('contact_name')

    if (error) throw error
    return { data: data || [], success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get selected contacts', success: false }
  }
}

export const selectAllContacts = async (userPhone: string): Promise<ApiResponse<void>> => {
  try {
    const { error } = await supabase
      .from('user_contacts')
      .update({ is_selected: true })
      .eq('user_phone', userPhone)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to select all contacts', success: false }
  }
} 