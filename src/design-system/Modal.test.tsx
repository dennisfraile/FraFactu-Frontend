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
  it('atrapa el foco: Shift+Tab desde el primer elemento salta al último', async () => {
    render(<Modal open onClose={() => {}} title="X"><button>Uno</button><button>Dos</button></Modal>)
    screen.getByText('Uno').focus()
    await userEvent.tab({ shift: true })
    expect(screen.getByText('Dos')).toHaveFocus()
  })
  it('atrapa el foco: Tab desde el último elemento vuelve al primero', async () => {
    render(<Modal open onClose={() => {}} title="X"><button>Uno</button><button>Dos</button></Modal>)
    screen.getByText('Dos').focus()
    await userEvent.tab()
    expect(screen.getByText('Uno')).toHaveFocus()
  })
})
