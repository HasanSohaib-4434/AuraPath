import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'auraPathTheme'

const THEME_META = {
  dark: { themeColor: '#6366f1', backgroundColor: '#12141a' },
  light: { themeColor: '#16a34a', backgroundColor: '#f7f8fa' },
}

const ThemeContext = createContext(null)

export const readStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const applyThemeToDocument = (theme) => {
  const next = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  const meta = THEME_META[next]
  let themeMeta = document.querySelector('meta[name="theme-color"]')
  if (!themeMeta) {
    themeMeta = document.createElement('meta')
    themeMeta.setAttribute('name', 'theme-color')
    document.head.appendChild(themeMeta)
  }
  themeMeta.setAttribute('content', meta.themeColor)
  return next
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => readStoredTheme())

  useEffect(() => {
    const applied = applyThemeToDocument(theme)
    try {
      localStorage.setItem(STORAGE_KEY, applied)
    } catch {}
  }, [theme])

  const setThemeMode = useCallback((mode) => {
    setTheme(mode === 'light' ? 'light' : 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      setTheme: setThemeMode,
      toggleTheme,
    }),
    [theme, setThemeMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext
