import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza el contenido según el estado fiscal', () => {
    render(<Badge estado="recibido">Recibido MH</Badge>)
    expect(screen.getByText('Recibido MH')).toBeInTheDocument()
  })
})
