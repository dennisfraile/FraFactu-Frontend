import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuthz } from './useAuthz'
import { useAuthStore } from '@/app/auth-store'
import { authAs } from '@/test/auth'

describe('useAuthz', () => {
  beforeEach(() => { authAs('EmisorAdmin') })

  it('expone el rol actual', () => {
    const { result } = renderHook(() => useAuthz())
    expect(result.current.rol).toBe('EmisorAdmin')
  })
  it('hasRole / hasAnyRole', () => {
    const { result } = renderHook(() => useAuthz())
    expect(result.current.hasRole('EmisorAdmin')).toBe(true)
    expect(result.current.hasRole('Cajero')).toBe(false)
    expect(result.current.hasAnyRole(['SuperAdmin', 'EmisorAdmin'])).toBe(true)
    expect(result.current.hasAnyRole(['Cajero'])).toBe(false)
  })
  it('sin usuario, todo false', () => {
    useAuthStore.setState({ token: null, status: 'anon', user: null })
    const { result } = renderHook(() => useAuthz())
    expect(result.current.rol).toBeUndefined()
    expect(result.current.hasAnyRole(['EmisorAdmin'])).toBe(false)
  })
})
