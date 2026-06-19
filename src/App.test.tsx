import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App (placeholder F0)', () => {
  it('muestra el nombre del proyecto', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'FraFactu' })).toBeInTheDocument()
  })
})
