import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Contact, Users, CheckSquare, Square, UserCheck, Search } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { syncPhoneContacts, getUserContacts, updateContactSelection, selectAllContacts } from '@/supabase/client'
import type { UserContact, PhoneContact } from '@/types'

export default function ContactSyncPage() {
  const navigate = useNavigate()
  const { userPhone } = useAuth()
  const [step, setStep] = useState<'request' | 'syncing' | 'selecting'>('request')
  const [contacts, setContacts] = useState<UserContact[]>([])
  const [selectedCount, setSelectedCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredContacts = useMemo(() => 
    contacts.filter(contact =>
      contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [contacts, searchTerm])

  const loadSyncedContacts = async () => {
    if (!userPhone) return
    
    try {
      const result = await getUserContacts(userPhone)
      if (result.success && result.data) {
        setContacts(result.data)
        setSelectedCount(result.data.filter(c => c.is_selected).length)
        
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
    
    toast.warning('שימוש בנתוני הדמיה', {
      description: 'סנכרון אנשי קשר אמיתי יופעל בגרסת ה-Build של האפליקציה.',
      duration: 5000,
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
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

  return (
    <div className="min-h-screen bg-dark">
      <Header 
        title="בחירת אנשי קשר" 
        showBack 
        onBack={() => setStep('request')}
      />
      
      <div className="p-4 mt-16 pb-28"> {/* Padding bottom for the fixed footer */}
        
        <div className="bg-dark-surface rounded-lg p-4 mb-4">
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
          </div>
        </div>

        <div className="relative mb-4">
          <input
            type="text"
            placeholder="חפש איש קשר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 bg-dark-card border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="text-gray-400" size={20} />
          </div>
        </div>

        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactToggle(contact.id, contact.is_selected)}
              className="bg-dark-card rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium">{contact.contact_name}</span>
                <span className="text-sm text-gray-400">{contact.contact_phone}</span>
              </div>
              
              {contact.is_selected ? (
                <CheckSquare className="text-blue-500" size={24} />
              ) : (
                <Square className="text-gray-500" size={24} />
              )}
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>{searchTerm ? 'לא נמצאו אנשי קשר התואמים לחיפוש.' : 'לא נמצאו אנשי קשר מסונכרנים.'}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full bg-dark-surface p-4 border-t border-gray-700 shadow-lg">
        <button
          onClick={handleFinish}
          disabled={selectedCount === 0}
          className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <UserCheck className="ml-2" size={20} />
          סיים ושמור בחירה ({selectedCount})
        </button>
      </div>
    </div>
  )
} 