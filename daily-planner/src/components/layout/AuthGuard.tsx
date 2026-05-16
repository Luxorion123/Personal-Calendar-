import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthPage from '@/pages/AuthPage'
import useStore from '@/store'
import { Clock } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const { loadFromCloud, migrateLocalToCloud, userId, setUserId } = useStore()

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleSignIn(session.user.id)
      }
      setChecking(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSignIn(session.user.id)
        setAuthed(true)
      } else if (event === 'SIGNED_OUT') {
        setUserId(null)
        setAuthed(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignIn(uid: string) {
    const isFirstLogin = userId === null
    if (isFirstLogin) {
      // Upload any existing localStorage data, then load from cloud
      await migrateLocalToCloud(uid)
    }
    await loadFromCloud(uid)
    setAuthed(true)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-[#4f8ef7] animate-pulse" />
          <p className="text-sm text-[#55556a]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authed) return <AuthPage />

  return <>{children}</>
}
