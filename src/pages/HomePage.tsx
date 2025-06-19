import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { PenSquare } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { formatRelativeTime, groupContactsByStatus } from '@/types'
import { getMutualContacts, getUserContacts } from '@/supabase/client'
import type { ContactWithStatus, User, UserContact } from '@/types'

export default function HomePage() {
  const navigate = useNavigate()
  const { userPhone, signOut } = useAuth()
  const [contacts, setContacts] = useState<ContactWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const grouped = groupContactsByStatus(contacts)
  
  const loadContacts = async (isRefresh = false) => {
    if (!userPhone) return
    
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      // Fetch both mutual contacts and the user's own contact list in parallel
      const [mutualResult, userContactsResult] = await Promise.all([
        getMutualContacts(userPhone),
        getUserContacts(userPhone),
      ])

      if (!mutualResult.success || !mutualResult.data) {
        throw new Error(mutualResult.error || 'שגיאה בטעינת אנשי קשר הדדיים')
      }

      if (!userContactsResult.success || !userContactsResult.data) {
        throw new Error(userContactsResult.error || 'שגיאה בטעינת רשימת אנשי הקשר שלך')
      }

      // Create a map from phone number to the name saved by the user
      const contactNameMap = new Map<string, string>()
      userContactsResult.data.forEach((contact: UserContact) => {
        // Ensure we have a valid name and phone for the map
        if (contact.contact_name && contact.contact_phone) {
          contactNameMap.set(contact.contact_phone, contact.contact_name)
        }
      })

      // Combine the data: use the name from the map, fallback to phone
      const contactsWithStatus: ContactWithStatus[] = mutualResult.data.map((user: User) => ({
        phone: user.phone,
        name: contactNameMap.get(user.phone) || user.phone, // Use saved name
        status: user.status,
        last_updated: user.last_updated,
        is_mutual: true,
      }))
      setContacts(contactsWithStatus)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }
  
  const handleRefresh = () => {
    loadContacts(true)
  }

  const handleLogout = async () => {
    await signOut()
  }
  
  useEffect(() => {
    if (userPhone) {
      loadContacts()
    }
  }, [userPhone])
  
    if (loading) {
    return (
      <div className="min-h-screen bg-dark pb-24">
        <Header title="מצב החברים שלי" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-400">טוען אנשי קשר...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark pb-24">
        <Header title="מצב החברים שלי" />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark pb-24">
      <Header
        title="מצב החברים שלי"
        showRefresh
        showContacts
        showLogout
        onRefresh={handleRefresh}
        onContacts={() => navigate('/contact-sync')}
        onLogout={handleLogout}
        isRefreshing={isRefreshing}
      />
      
      {/* Status Summary */}
      <div className="mt-16 p-4 bg-dark-surface mx-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-center cursor-pointer" onClick={() => document.getElementById('shelter-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="text-shelter text-2xl font-bold">{grouped.shelter.length}</div>
            <div className="text-xs">במרחב מוגן</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => document.getElementById('safe-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="text-safe text-2xl font-bold">{grouped.safe.length}</div>
            <div className="text-xs">בטוחים</div>
          </div>
          <div className="text-center cursor-pointer" onClick={() => document.getElementById('none-section')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="text-no-update text-2xl font-bold">{grouped.none.length}</div>
            <div className="text-xs">לא עדכנו</div>
          </div>
        </div>
      </div>
      
      {/* Friends List */}
      <div className="mt-4 px-4">
        {/* No contacts message */}
        {contacts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">עדיין לא סנכרנת אנשי קשר</p>
            <p className="text-gray-500 text-sm mb-6">
              כדי לראות את הסטטוס של החברים שלך, תחילה צריך לסנכרן אנשי קשר מהטלפון
            </p>
            <button
              onClick={() => navigate('/contact-sync')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              סנכרן אנשי קשר
            </button>
          </div>
        )}

        {/* In Shelter Friends */}
        {grouped.shelter.length > 0 && (
          <div id="shelter-section" className="mb-6">
            <h2 className="text-shelter font-bold mb-2 flex items-center">
              במרחב מוגן
            </h2>
            {grouped.shelter.map((contact) => (
              <div key={contact.phone} className="bg-dark-card rounded-lg p-4 mb-2 border-r-4 border-shelter">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <div className="text-xs text-gray-400 flex items-center mt-1">
                      {formatRelativeTime(contact.last_updated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Safe Friends */}
        {grouped.safe.length > 0 && (
          <div id="safe-section" className="mb-6">
            <h2 className="text-safe font-bold mb-2 flex items-center">
              בטוחים
            </h2>
            {grouped.safe.map((contact) => (
              <div key={contact.phone} className="bg-dark-card rounded-lg p-4 mb-2 border-r-4 border-safe">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <div className="text-xs text-gray-400 flex items-center mt-1">
                      {formatRelativeTime(contact.last_updated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Not Updated Friends */}
        {grouped.none.length > 0 && (
          <div id="none-section" className="mb-6">
            <h2 className="text-gray-400 font-bold mb-2 flex items-center">
              לא עדכנו סטטוס
            </h2>
            {grouped.none.map((contact) => (
              <div key={contact.phone} className="bg-dark-card rounded-lg p-4 mb-2 border-r-4 border-gray-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{contact.name}</h3>
                    <div className="text-xs text-gray-400 flex items-center mt-1">
                      עוד לא עדכנו
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/update-status')}
        className="fixed bottom-6 left-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        aria-label="עדכן מצב"
      >
        <PenSquare size={28} />
      </button>
    </div>
  )
} 