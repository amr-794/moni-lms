import { useEffect } from 'react'
import api from '../utils/api'

export function ThemeProvider({ children }) {
  useEffect(() => {
    api.get('/api/settings').then(({ data }) => {
      const colors = data.theme_colors
      if (colors) {
        document.documentElement.style.setProperty('--primary', colors.primary || '#6c63ff')
        document.documentElement.style.setProperty('--secondary', colors.secondary || '#ff6584')
        document.documentElement.style.setProperty('--accent', colors.accent || '#43e97b')
      }
      if (data.site_name) document.title = data.site_name
    }).catch(() => {})
  }, [])

  return children
}

export default ThemeProvider
