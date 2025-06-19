import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/supabase/client'

interface AuthContextType {
  user: User | null
  userPhone: string | null
  loading: boolean
  signOut: () => Promise<void>
  mockLogin: (phone: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mockUser, setMockUser] = useState<{phone: string} | null>(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Set RLS context when user logs in
      if (session?.user?.phone) {
        await supabase.rpc('set_current_user_phone', {
          user_phone: session.user.phone
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setMockUser(null)
  }

  const mockLogin = async (phone: string) => {
    // Set RLS context for mock user
    await supabase.rpc('set_current_user_phone', { user_phone: phone })
    setMockUser({ phone })
  }

  const userPhone = user?.phone || mockUser?.phone || null

  return (
    <AuthContext.Provider
      value={{
        user: user || (mockUser ? { phone: mockUser.phone } as User : null),
        userPhone,
        loading,
        signOut,
        mockLogin,
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