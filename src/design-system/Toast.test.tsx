import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Trigger() {
  const { show } = useToast()
  return <button onClick={() => show('Guardado')}>Mostrar</button>
}

describe('Toast', () => {
  it('muestra un mensaje al invocar show', async () => {
    render(<ToastProvider><Trigger /></ToastProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
  })
})
