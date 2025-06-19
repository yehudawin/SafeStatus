import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Contact, Users, CheckSquare, Square, UserCheck } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { syncPhoneContacts, getUserContacts, updateContactSelection, selectAllContacts } from '@/supabase/client'
import { isValidIsraeliPhone, normalizePhoneNumber } from '@/types'
import type { UserContact, PhoneContact } from '@/types'

export default function ContactSyncPage() {
  const navigate = useNavigate()
  const { userPhone } = useAuth()
  const [step, setStep] = useState<'request' | 'syncing' | 'selecting'>('request')
  const [contacts, setContacts] = useState<UserContact[]>([])
  const [selectedCount, setSelectedCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadSyncedContacts = async () => {
    if (!userPhone) return
    
    try {
      const result = await getUserContacts(userPhone)
      if (result.success && result.data) {
        setContacts(result.data)
        setSelectedCount(result.data.filter(c => c.is_selected).length)
        
        // If we have synced contacts, go directly to selection
        if (result.data.length > 0) {
          setStep('selecting')
        }
      }
    } catch (error) {
      console.error('Error loading synced contacts:', error)
    }
  }

  const requestContactsPermission = async () => {
    setStep('syncing')
    setLoading(true)
    
    try {
      // Simulate permission request and contact access
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock contacts data (in real app, this would come from navigator.contacts API)
      const mockPhoneContacts: PhoneContact[] = [
        { name: 'אמא', phoneNumbers: ['050-1234567'] },
        { name: 'אבא', phoneNumbers: ['052-2345678'] },
        { name: 'אחי דני', phoneNumbers: ['053-3456789', '02-9876543'] },
        { name: 'חברה שרה', phoneNumbers: ['054-4567890'] },
        { name: 'עבודה - מנהל', phoneNumbers: ['03-1234567', '050-9876543'] },
        { name: 'רופא המשפחה', phoneNumbers: ['02-5555555'] },
        { name: 'חבר מהצבא', phoneNumbers: ['055-1111111'] }
      ]
      
      if (!userPhone) {
        toast.error('שגיאה בזיהוי המשתמש')
        return
      }

      // Sync contacts to database
      const result = await syncPhoneContacts(userPhone, mockPhoneContacts)
      
      if (result.success && result.data) {
        setContacts(result.data)
        setStep('selecting')
        toast.success(`סונכרנו ${result.data.length} אנשי קשר מהטלפון`)
      } else {
        toast.error(result.error || 'שגיאה בסנכרון אנשי הקשר')
        setStep('request')
      }
    } catch (error) {
      toast.error('שגיאה בגישה לאנשי הקשר')
      setStep('request')
    } finally {
      setLoading(false)
    }
  }

  const handleContactToggle = async (contactId: string, currentSelection: boolean) => {
    try {
      const result = await updateContactSelection(contactId, !currentSelection)
      
      if (result.success) {
        setContacts(prev => prev.map(contact => 
          contact.id === contactId 
            ? { ...contact, is_selected: !currentSelection }
            : contact
        ))
        
        setSelectedCount(prev => currentSelection ? prev - 1 : prev + 1)
      } else {
        toast.error(result.error || 'שגיאה בעדכון הבחירה')
      }
    } catch (error) {
      toast.error('שגיאה בעדכון הבחירה')
    }
  }

  const handleSelectAll = async () => {
    if (!userPhone) return
    
    try {
      const result = await selectAllContacts(userPhone)
      
      if (result.success) {
        setContacts(prev => prev.map(contact => ({ ...contact, is_selected: true })))
        setSelectedCount(contacts.length)
        toast.success('נבחרו כל אנשי הקשר')
      } else {
        toast.error(result.error || 'שגיאה בבחירת כל אנשי הקשר')
      }
    } catch (error) {
      toast.error('שגיאה בבחירת כל אנשי הקשר')
    }
  }

  const handleFinish = () => {
    if (selectedCount === 0) {
      toast.error('אנא בחר לפחות איש קשר אחד')
      return
    }
    
    toast.success(`הגדרת סנכרון הושלמה! נבחרו ${selectedCount} אנשי קשר`)
    navigate('/')
  }

  const handleSkip = () => {
    toast.info('דילגת על סנכרון אנשי קשר. תוכל להגדיר זאת מאוחר יותר.')
    navigate('/')
  }

  useEffect(() => {
    if (userPhone) {
      loadSyncedContacts()
    }
  }, [userPhone])

  if (step === 'request') {
    return (
      <div className="min-h-screen bg-dark">
        <Header 
          title="סנכרון אנשי קשר" 
          showBack 
          onBack={() => navigate('/')}
        />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mt-16">
          <div className="mb-8 flex justify-center">
            <div className="bg-blue-600 bg-opacity-20 rounded-full p-6">
              <Contact className="text-blue-500" size={80} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-center">סנכרון אנשי קשר</h1>
          
          <p className="text-center text-gray-300 mb-8 leading-relaxed">
            כדי להתחיל להשתמש באפליקציה, נצטרך לסנכרן את רשימת אנשי הקשר שלך מהטלפון.
            <br /><br />
            לאחר מכן תוכל לבחור בדיוק עם מי אתה רוצה לשתף את הסטטוס שלך.
          </p>
          
          <button
            onClick={requestContactsPermission}
            disabled={loading}
            className="bg-blue-600 w-full py-4 rounded-lg text-lg font-bold mb-6 flex items-center justify-center disabled:opacity-50"
          >
            <Contact className="ml-2" size={20} />
            סנכרן אנשי קשר מהטלפון
          </button>
          
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2 text-green-400">מה קורה עכשיו?</h3>
            <ul className="text-sm text-green-300 space-y-1">
              <li>• נקרא את רשימת אנשי הקשר שלך</li>
              <li>• תבחר מי מהם יקבל את הסטטוס שלך</li>
              <li>• רק בחירה הדדית תאפשר לראות סטטוסים</li>
            </ul>
          </div>

          <button
            onClick={handleSkip}
            className="text-gray-400 text-sm py-2 hover:underline"
          >
            דלג לבינתיים (תוכל להגדיר מאוחר יותר)
          </button>
        </div>
      </div>
    )
  }

  if (step === 'syncing') {
    return (
      <div className="min-h-screen bg-dark">
        <Header title="סנכרון אנשי קשר" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mt-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
          <h2 className="text-xl font-bold mb-2">מסנכרן אנשי קשר...</h2>
          <p className="text-gray-400 text-center">
            קורא את רשימת אנשי הקשר שלך מהטלפון
          </p>
        </div>
      </div>
    )
  }

  // Selection step
  return (
    <div className="min-h-screen bg-dark">
      <Header 
        title="בחירת אנשי קשר" 
        showBack 
        onBack={() => setStep('request')}
      />
      
      <div className="p-4 mt-16">
        {/* Summary */}
        <div className="bg-dark-surface rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <Users className="ml-2" size={20} />
              נמצאו {contacts.length} אנשי קשר
            </h2>
            <span className="text-blue-400 font-medium">
              נבחרו: {selectedCount}
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center"
            >
              <CheckSquare className="ml-1" size={16} />
              בחר הכל
            </button>
            
            <button
              onClick={handleFinish}
              disabled={selectedCount === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <UserCheck className="ml-1" size={16} />
              סיים ({selectedCount})
            </button>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-dark-surface rounded-lg p-4">
          <h3 className="font-medium mb-4">בחר עם מי לשתף סטטוס:</h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contacts.map((contact) => (
              <div 
                key={contact.id} 
                className="bg-dark-card rounded-lg p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleContactToggle(contact.id, contact.is_selected)}
                    className="ml-3"
                  >
                    {contact.is_selected ? (
                      <CheckSquare className="text-blue-500" size={20} />
                    ) : (
                      <Square className="text-gray-500" size={20} />
                    )}
                  </button>
                  
                  <div>
                    <p className="font-medium">{contact.contact_name}</p>
                    <p className="text-sm text-gray-400">
                      {contact.contact_phone}
                      {isValidIsraeliPhone(normalizePhoneNumber(contact.contact_phone)) && (
                        <span className="text-green-400 mr-2">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
          <h3 className="font-medium mb-2 text-blue-400">חשוב לדעת:</h3>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• רק אנשי קשר שבחרת יוכלו לראות את הסטטוס שלך</li>
            <li>• כדי לראות את הסטטוס שלהם, גם הם צריכים לבחור אותך</li>
            <li>• ניתן לשנות את הבחירות בכל עת בהגדרות</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 