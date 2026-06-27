import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DescartarDteModal } from './DescartarDteModal'

describe('DescartarDteModal', () => {
  it('exige un motivo antes de confirmar', async () => {
    const user = userEvent.setup()
    const onConfirmar = vi.fn()
    render(<DescartarDteModal onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(await screen.findByText(/motivo.*obligatorio/i)).toBeInTheDocument()
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('confirma con el motivo escrito', async () => {
    const user = userEvent.setup()
    const onConfirmar = vi.fn()
    render(<DescartarDteModal onConfirmar={onConfirmar} onClose={() => {}} cargando={false} />)
    await user.type(screen.getByLabelText(/motivo/i), 'Duplicado')
    await user.click(screen.getByRole('button', { name: /descartar dte/i }))
    expect(onConfirmar).toHaveBeenCalledWith('Duplicado')
  })
})
