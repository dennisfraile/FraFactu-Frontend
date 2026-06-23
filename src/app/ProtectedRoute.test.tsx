import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuthStore } from './auth-store'

function setup(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Privado</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/first-login" element={<div>Primer ingreso</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null, status: 'anon' }))
  it('anon → redirige a login', () => { setup(); expect(screen.getByText('Login')).toBeInTheDocument() })
  it('restricted → redirige a primer ingreso', () => {
    useAuthStore.setState({ status: 'restricted', token: 't', user: null })
    setup(); expect(screen.getByText('Primer ingreso')).toBeInTheDocument()
  })
  it('authenticated → renderiza el contenido', () => {
    useAuthStore.setState({ status: 'authenticated', token: 't', user: null })
    setup(); expect(screen.getByText('Privado')).toBeInTheDocument()
  })
})
