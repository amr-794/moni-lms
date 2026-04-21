import { useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from './useAuth'

export function useOnlinePresence() {
  const { student } = useAuth()

  useEffect(() => {
    if (!student) return
    const ping = () => api.post('/api/online/ping', { current_page: window.location.pathname }).catch(() => {})
    ping()
    const interval = setInterval(ping, 30000)
    return () => clearInterval(interval)
  }, [student])
}

export default useOnlinePresence
