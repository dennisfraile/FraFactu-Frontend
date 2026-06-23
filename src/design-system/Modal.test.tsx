import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('no renderiza cuando open=false', () => {
    render(<Modal open={false} onClose={() => {}}>Hola</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('renderiza y cierra con Escape', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Confirmar">Contenido</Modal>)
    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
