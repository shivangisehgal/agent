/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'portal-theme'

const Ctx = createContext<{
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
} | null>(null)

function readStored(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' ? v : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStored())

  const apply = useCallback((t: ThemeMode) => {
    document.documentElement.dataset.theme = t
    window.localStorage.setItem(STORAGE_KEY, t)
  }, [])

  useEffect(() => {
    apply(theme)
  }, [theme, apply])

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme requires ThemeProvider')
  return v
}
