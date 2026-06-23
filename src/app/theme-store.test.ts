import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from './theme-store'

describe('theme-store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    useThemeStore.setState({ theme: 'light' })
  })

  it('toggle alterna entre light y dark y aplica la clase en <html>', () => {
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    useThemeStore.getState().toggle()
    expect(useThemeStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persiste la preferencia en localStorage', () => {
    useThemeStore.getState().toggle()
    expect(localStorage.getItem('frafactu-theme')).toBe('dark')
  })
})
