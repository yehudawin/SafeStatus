import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Contact, Users, CheckSquare, Square, UserCheck, Search } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { syncPhoneContacts, getUserContacts, updateContactSelection, selectAllContacts } from '@/supabase/client'
import { requestContactsPermission as requestPermission, getDeviceContacts, isContactsSupported } from '@/utils/contactsService'
import { useLogger } from '@/utils/useLogger'
import type { UserContact } from '@/types'

export default function ContactSyncPage() {
  const navigate = useNavigate()
  const { userPhone } = useAuth()
  const { logError } = useLogger()
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
      logError('Error loading synced contacts', error)
      if (import.meta.env.DEV) {
        console.error('Error loading synced contacts:', error)
      }
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  const requestContactsPermission = async () => {
    setStep('syncing')
    setLoading(true)
    
    try {
      // בקש הרשאה לגישה לאנשי קשר (רק במכשיר נייד)
      if (isContactsSupported()) {
        const permissionResult = await requestPermission()
        if (!permissionResult.granted) {
          toast.error(permissionResult.message)
          setStep('request')
          setLoading(false)
          return
        }
        toast.success(permissionResult.message)
      } else {
        toast.warning('שימוש בנתוני הדמיה', {
          description: 'גישה לאנשי קשר אמיתיים זמינה רק באפליקציית הנייד.',
          duration: 3000,
        });
      }

      // השהיה קצרה לחוויית משתמש טובה
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // קבל את אנשי הקשר מהמכשיר או נתוני הדמיה
      const contactsResult = await getDeviceContacts()
      
      if (!contactsResult.success || !contactsResult.contacts) {
        toast.error(contactsResult.error || 'שגיאה בקריאת אנשי קשר')
        setStep('request')
        return
      }

      if (!userPhone) {
        toast.error('שגיאה בזיהוי המשתמש')
        setStep('request')
        return
      }

      // סנכרן את אנשי הקשר לדאטה בייס
      const result = await syncPhoneContacts(userPhone, contactsResult.contacts)
      
      if (result.success && result.data) {
        setContacts(result.data)
        setStep('selecting')
        const platformMessage = isContactsSupported() ? 'מהמכשיר' : '(נתוני הדמיה)'
        toast.success(`סונכרנו ${result.data.length} אנשי קשר ${platformMessage}`)
      } else {
        toast.error(result.error || 'שגיאה בסנכרון אנשי הקשר')
        setStep('request')
      }
    } catch (error) {
      logError('Error in requestContactsPermission', error)
      if (import.meta.env.DEV) {
        console.error('Error in requestContactsPermission:', error)
      }
      toast.error('שגיאה בגישה לאנשי קשר. אנא נסה שוב')
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
      <div className="min-h-screen bg-background">
        <Header 
          title="סנכרון אנשי קשר" 
          showBack 
          onBack={() => navigate('/')}
        />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mt-20">
          <div className="mb-8 flex justify-center">
            <div className="bg-primary bg-opacity-20 rounded-full p-6">
              <Contact className="text-primary" size={80} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-center text-text-primary">סנכרון אנשי קשר</h1>
          
          <p className="text-center text-text-secondary mb-8 leading-relaxed">
            כדי להתחיל להשתמש באפליקציה, נצטרך לגשת לרשימת אנשי הקשר שלך מהמכשיר.
            <br /><br />
            לאחר מכן תוכל לבחור בדיוק עם מי אתה רוצה לשתף את הסטטוס שלך במצבי חירום.
          </p>
          
          <button
            onClick={requestContactsPermission}
            disabled={loading}
            className="button-primary w-full py-4 text-lg font-bold mb-6 flex items-center justify-center disabled:opacity-50 hover:bg-opacity-90 transition-colors"
          >
            <Contact className="ml-2" size={20} />
            {isContactsSupported() ? 'גש לאנשי קשר במכשיר' : 'התחל עם נתוני הדמיה'}
          </button>
          
          <div className="bg-safe/10 border border-safe/30 rounded-design p-4 mb-6">
            <h3 className="font-medium mb-2 text-safe">מה קורה עכשיו?</h3>
            <ul className="text-sm text-safe space-y-1">
              <li>• נקרא את רשימת אנשי הקשר שלך</li>
              <li>• תבחר מי מהם יקבל את הסטטוס שלך</li>
              <li>• רק בחירה הדדית תאפשר לראות סטטוסים</li>
            </ul>
          </div>

          <button
            onClick={handleSkip}
            className="text-text-secondary text-sm py-2 hover:underline"
          >
            דלג לבינתיים (תוכל להגדיר מאוחר יותר)
          </button>
        </div>
      </div>
    )
  }

  if (step === 'syncing') {
    return (
      <div className="min-h-screen bg-background">
        <Header title="סנכרון אנשי קשר" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 mt-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-6"></div>
          <h2 className="text-xl font-bold mb-2 text-text-primary">מסנכרן אנשי קשר...</h2>
          <p className="text-text-secondary text-center">
            קורא את רשימת אנשי הקשר שלך מהטלפון
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="בחירת אנשי קשר" 
        showBack 
        onBack={() => setStep('request')}
      />
      
      <div className="p-4 mt-20 pb-28"> {/* Padding bottom for the fixed footer */}
        
        <div className="card-design mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center text-text-primary">
              <Users className="ml-2" size={20} />
              נמצאו {contacts.length} אנשי קשר
            </h2>
            <span className="text-primary font-medium">
              נבחרו: {selectedCount}
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="button-primary text-sm hover:bg-opacity-90 transition-colors flex items-center"
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
            className="w-full p-3 pl-10 bg-light-surface border border-gray-300 rounded-design text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="text-text-secondary" size={20} />
          </div>
        </div>

        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => handleContactToggle(contact.id, contact.is_selected)}
              className="card-design flex items-center justify-between cursor-pointer hover:shadow-medium transition-all duration-200"
            >
              <div className="flex flex-col">
                <span className="font-medium text-text-primary">{contact.contact_name}</span>
                <span className="text-sm text-text-secondary">{contact.contact_phone}</span>
              </div>
              
              {contact.is_selected ? (
                <CheckSquare className="text-primary" size={24} />
              ) : (
                <Square className="text-text-secondary" size={24} />
              )}
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-text-secondary">
              <p>{searchTerm ? 'לא נמצאו אנשי קשר התואמים לחיפוש.' : 'לא נמצאו אנשי קשר מסונכרנים.'}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 w-full bg-card-background p-4 border-t border-gray-200 shadow-medium">
        <button
          onClick={handleFinish}
          disabled={selectedCount === 0}
          className="w-full bg-safe text-white py-3 rounded-pill text-lg font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <UserCheck className="ml-2" size={20} />
          סיים ושמור בחירה ({selectedCount})
        </button>
      </div>
    </div>
  )
} 