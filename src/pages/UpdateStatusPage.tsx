import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import Header from '@/components/Header'
import StatusButton from '@/components/StatusButton'
import { useAuth } from '@/contexts/AuthContext'
import { updateUserStatus, getUserByPhone } from '@/supabase/client'
import { getStatusText, getStatusColor, formatRelativeTime } from '@/types'
import { useLogger } from '@/utils/useLogger'
import type { UserStatus } from '@/types'

export default function UpdateStatusPage() {
  const navigate = useNavigate()
  const { userPhone, loading: authLoading } = useAuth()
  const { logError, logUserAction } = useLogger()
  const [currentStatus, setCurrentStatus] = useState<UserStatus>('none')
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString())
  const [isUpdating, setIsUpdating] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCurrentStatus = async () => {
    if (!userPhone) return
    
    setLoading(true)
    try {
      const result = await getUserByPhone(userPhone)
      if (result.success && result.data) {
        setCurrentStatus(result.data.status)
        setLastUpdated(result.data.last_updated)
      }
    } catch (error) {
      logError('Error loading current status', error)
      if (import.meta.env.DEV) {
        console.error('Error loading current status:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: UserStatus) => {
    if (!userPhone) {
      toast.error('עליך להתחבר קודם כדי לעדכן סטטוס')
      navigate('/login')
      return
    }
    
    logUserAction(`Status update attempt: ${newStatus}`)
    setIsUpdating(true)
    
    try {
      const result = await updateUserStatus(userPhone, newStatus)
      
      if (result.success) {
        setCurrentStatus(newStatus)
        setLastUpdated(new Date().toISOString())
        toast.success('הסטטוס עודכן בהצלחה!')
        logUserAction(`Status updated successfully: ${newStatus}`)
        
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }
      } else {
        const errorMessage = result.error || 'שגיאה בעדכון הסטטוס'
        toast.error(errorMessage)
        logError('Status update failed', result.error)
      }
    } catch (error) {
      const errorMessage = 'שגיאה בחיבור לשרת'
      toast.error(errorMessage)
      logError('Status update exception', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  useEffect(() => {
    if (!authLoading) {
      if (!userPhone) {
        toast.error('עליך להתחבר קודם כדי לעדכן סטטוס')
        navigate('/login')
        return
      }
      loadCurrentStatus()
    }
  }, [userPhone, authLoading, logError])
  
  // Show loading while auth is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="עדכון מצב"
          showBack
          onBack={() => navigate('/')}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-text-secondary">
              {authLoading ? 'בודק אימות...' : 'טוען מצב נוכחי...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated after loading
  if (!userPhone) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="עדכון מצב"
          showBack
          onBack={() => navigate('/')}
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-text-primary mb-4">עליך להתחבר קודם כדי לעדכן סטטוס</p>
            <button 
              onClick={() => navigate('/login')}
              className="button-primary"
            >
              עבור להתחברות
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="עדכון מצב"
        showBack
        onBack={() => navigate('/')}
      />
      
      <div className="mt-20 px-6">
        {/* Current Status */}
        <div className="card-design text-center mb-8">
          <h2 className="text-lg mb-2 text-text-primary">המצב שלך כרגע</h2>
          <div className={`font-bold text-xl mb-2 flex justify-center items-center ${getStatusColor(currentStatus)}`}>
            {getStatusText(currentStatus)}
          </div>
          <div className="text-xs text-text-secondary">
            עודכן לאחרונה: {formatRelativeTime(lastUpdated)}
          </div>
        </div>
        
        {/* Status Buttons */}
        <div className="space-y-6">
          <StatusButton
            statusType="shelter"
            onClick={handleStatusUpdate}
            disabled={isUpdating}
          />
          
          <StatusButton
            statusType="safe"
            onClick={handleStatusUpdate}
            disabled={isUpdating}
          />
        </div>
        
        {/* Information Note */}
        <div className="mt-8 text-sm text-text-secondary text-center px-4">
          העדכון ישלח באופן אוטומטי לכל אנשי הקשר ששמרו אותך
        </div>
      </div>
    </div>
  )
} 