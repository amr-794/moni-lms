import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verify = async () => {
      try {
        const path = window.location.pathname
        if (path.startsWith('/admin')) {
          const { data } = await api.get('/api/auth/admin-me')
          setAdmin(data.admin)
          localStorage.setItem('admin', JSON.stringify(data.admin))
        } else if (localStorage.getItem('user')) {
          const { data } = await api.get('/api/auth/me')
          setStudent(data.student)
          localStorage.setItem('user', JSON.stringify(data.student))
        }
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('admin')
        setStudent(null)
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  const loginStudent = async (identifier, password, remember_me) => {
    const { data } = await api.post('/api/auth/login', { identifier, password, remember_me })
    setStudent(data.student)
    localStorage.setItem('user', JSON.stringify(data.student))
    return data
  }

  const loginAdmin = async (username, password) => {
    const { data } = await api.post('/api/auth/admin-login', { username, password })
    setAdmin(data.admin)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    return data
  }

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {})
    setStudent(null)
    setAdmin(null)
    localStorage.removeItem('user')
    localStorage.removeItem('admin')
  }

  return (
    <AuthContext.Provider value={{ student, admin, loading, loginStudent, loginAdmin, logout, setStudent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default useAuth
