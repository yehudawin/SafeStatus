import { createClient } from '@supabase/supabase-js'
import type { Database, User, Contact, UserStatus, ApiResponse, ContactWithStatus, UserContact, PhoneContact } from '@/types'

const supabaseUrl = 'https://avjuwnpuprutycsmyiar.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2anV3bnB1cHJ1dHljc215aWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMjk2MzYsImV4cCI6MjA2NTkwNTYzNn0.pCuCx5FFitA8pvVgWaTMdNEL783Nfqf9gAUuoXSzkaQ'

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
    const { data, error } = await supabase
      .from('users')
      .upsert({ phone, status, last_updated: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error
    return { data, success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update status', success: false }
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
    // Clear existing contacts first
    await supabase
      .from('user_contacts')
      .delete()
      .eq('user_phone', userPhone)

    // Prepare contacts for insertion
    const contactsToInsert = contacts.flatMap(contact => 
      contact.phoneNumbers.map(phone => ({
        user_phone: userPhone,
        contact_name: contact.name,
        contact_phone: phone,
        is_selected: false // Default to not selected
      }))
    )

    const { data, error } = await supabase
      .from('user_contacts')
      .insert(contactsToInsert)
      .select()

    if (error) throw error
    return { data: data || [], success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to sync contacts', success: false }
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