
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  first_name: string
  last_name: string
  description: string | null
  role: 'admin' | 'operator' | 'parent'
  is_active: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      setUser(user)

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, description, role, is_active'
          )
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Errore caricamento profilo:', error)
        }

        if (mounted) {
          setProfile(profileData)
        }
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
  }
}