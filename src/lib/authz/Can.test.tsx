import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Can } from './Can'
import { authAs } from '@/test/auth'

function setRol(rolNombre: string) {
  authAs(rolNombre, { accesoTodasSucursales: true, sucursalIds: [2] })
}

describe('Can', () => {
  beforeEach(() => setRol('EmisorAdmin'))

  it('renderiza children si el rol califica', () => {
    render(<Can roles={['EmisorAdmin']}><button>Nuevo</button></Can>)
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument()
  })
  it('no renderiza nada si no califica y no hay fallback', () => {
    setRol('Cajero')
    render(<Can roles={['EmisorAdmin']}><button>Nuevo</button></Can>)
    expect(screen.queryByRole('button', { name: 'Nuevo' })).toBeNull()
  })
  it('renderiza fallback si no califica', () => {
    setRol('Cajero')
    render(<Can roles={['EmisorAdmin']} fallback={<span>Sin permiso</span>}><button>Nuevo</button></Can>)
    expect(screen.getByText('Sin permiso')).toBeInTheDocument()
  })
})
