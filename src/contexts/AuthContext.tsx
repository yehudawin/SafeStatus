import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/supabase/client'

interface AuthContextType {
  user: User | null
  userPhone: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('AuthContext: Checking for existing sessions...')
    }

    // Get initial session
    const getSession = async () => {
      // First check for test session in localStorage
      const testSession = localStorage.getItem('supabase.auth.token')
      if (testSession) {
        try {
          const parsedSession = JSON.parse(testSession)
          if (import.meta.env.DEV) {
            console.log('AuthContext: Found test session:', parsedSession)
          }
          if (parsedSession.user && parsedSession.expires_at > Date.now()) {
            if (import.meta.env.DEV) {
              console.log('AuthContext: Test session is valid, setting user')
            }
            setUser(parsedSession.user)
            
            // Set RLS context for test session too!
            if (parsedSession.user.phone) {
              try {
                await supabase.rpc('set_current_user_phone', {
                  user_phone: parsedSession.user.phone
                })
                if (import.meta.env.DEV) {
                  console.log('AuthContext: Set RLS context for test session:', parsedSession.user.phone)
                }
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.error('AuthContext: Error setting RLS context for test session:', error)
                }
              }
            }
            
            setLoading(false)
            return
          } else {
            if (import.meta.env.DEV) {
              console.log('AuthContext: Test session expired, removing it')
            }
            // Test session expired, remove it
            localStorage.removeItem('supabase.auth.token')
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('AuthContext: Error parsing test session:', error)
          }
          localStorage.removeItem('supabase.auth.token')
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('AuthContext: No test session found')
        }
      }

      // Check for real Supabase session
      if (import.meta.env.DEV) {
        console.log('AuthContext: Checking Supabase session...')
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (import.meta.env.DEV) {
          console.log('AuthContext: Supabase session:', session)
        }
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Set RLS context when user logs in with real session
        if (session?.user?.phone) {
          await supabase.rpc('set_current_user_phone', {
            user_phone: session.user.phone
          })
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('AuthContext: Error getting Supabase session:', error)
        }
        setUser(null)
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.DEV) {
        console.log('AuthContext: Auth state change:', event, session)
      }
      
      // Don't override test sessions unless we have a real session
      const testSession = localStorage.getItem('supabase.auth.token')
      if (testSession && !session) {
        if (import.meta.env.DEV) {
          console.log('AuthContext: Ignoring auth state change because we have a valid test session')
        }
        return
      }
      
      setUser(session?.user ?? null)
      setLoading(false)

      // Set RLS context when user logs in
      if (session?.user?.phone) {
        try {
          await supabase.rpc('set_current_user_phone', {
            user_phone: session.user.phone
          })
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('AuthContext: Error setting RLS context:', error)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    // Clear test session if it exists
    localStorage.removeItem('supabase.auth.token')
    // Sign out from Supabase
    await supabase.auth.signOut()
    setUser(null)
  }

  const userPhone = user?.phone || null

  return (
    <AuthContext.Provider
      value={{
        user,
        userPhone,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 