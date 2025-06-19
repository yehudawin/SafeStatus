import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { formatRelativeTime, groupContactsByStatus } from '@/types'
import { getMutualContacts } from '@/supabase/client'
import type { ContactWithStatus, User } from '@/types'

export default function HomePage() {
  const navigate = useNavigate()
  const { userPhone, signOut } = useAuth()
  const [contacts, setContacts] = useState<ContactWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const grouped = groupContactsByStatus(contacts)
  
  const loadContacts = async () => {
    if (!userPhone) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await getMutualContacts(userPhone)
      if (result.success && result.data) {
        // Convert User objects to ContactWithStatus objects
        const contactsWithStatus: ContactWithStatus[] = result.data.map((user: User) => ({
          phone: user.phone,
          name: user.phone, // For now, use phone as name until we have name field
          status: user.status,
          last_updated: user.last_updated,
          is_mutual: true
        }))
        setContacts(contactsWithStatus)
      } else {
        setError(result.error || 'שגיאה בטעינת אנשי הקשר')
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefresh = () => {
    loadContacts()
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
      />
      
      {/* Status Summary */}
      <div className="mt-16 p-4 bg-dark-surface mx-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-shelter text-2xl font-bold">{grouped.shelter.length}</div>
            <div className="text-xs">במרחב מוגן</div>
          </div>
          <div className="text-center">
            <div className="text-safe text-2xl font-bold">{grouped.safe.length}</div>
            <div className="text-xs">בטוחים</div>
          </div>
          <div className="text-center">
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
          <div className="mb-6">
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
          <div className="mb-6">
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
      </div>
      
      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/update-status')}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <span className="text-sm font-medium">עדכן מצב</span>
      </button>
    </div>
  )
} 