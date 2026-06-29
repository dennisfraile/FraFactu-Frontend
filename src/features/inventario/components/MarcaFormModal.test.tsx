// src/features/inventario/components/MarcaFormModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarcaFormModal } from './MarcaFormModal'

describe('MarcaFormModal', () => {
  it('no guarda sin nombre', () => {
    const onGuardar = vi.fn()
    render(<MarcaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).not.toHaveBeenCalled()
  })
  it('guarda con nombre', () => {
    const onGuardar = vi.fn()
    render(<MarcaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Acme' }))
  })
})
