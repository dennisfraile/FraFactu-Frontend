import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza el texto y dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Emitir</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Emitir' }))
    expect(onClick).toHaveBeenCalled()
  })
  it('loading deshabilita y marca aria-busy', () => {
    render(<Button loading>Emitir</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
  })
})
