import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renderiza los hijos cuando no hay error', () => {
    render(<ErrorBoundary><div>contenido ok</div></ErrorBoundary>)
    expect(screen.getByText('contenido ok')).toBeInTheDocument()
  })

  it('muestra el fallback cuando un hijo lanza en render', () => {
    // React vuelca el error capturado a console.error; lo silenciamos para no
    // ensuciar la salida del test (es el comportamiento esperado, no un fallo).
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('heading', { name: /algo salió mal/i })).toBeInTheDocument()
    spy.mockRestore()
  })
})
