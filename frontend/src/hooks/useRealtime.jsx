import { useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from './useAuth'

export function useRealtime() {
  const { student, logout } = useAuth()

  useEffect(() => {
    if (!student) return

    // Listen for session invalidation (another device logged in)
    const channel = supabase
      .channel(`session-${student.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `student_id=eq.${student.id}`,
      }, (payload) => {
        if (payload.new?.is_active === false) {
          alert('تم تسجيل دخولك من جهاز آخر. سيتم تسجيل خروجك.')
          logout()
          window.location.href = '/login'
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [student])
}

export default useRealtime
