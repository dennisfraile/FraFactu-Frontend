// src/features/inventario/components/CategoriaFormModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoriaFormModal } from './CategoriaFormModal'

describe('CategoriaFormModal', () => {
  it('valida obligatorios', () => {
    const onGuardar = vi.fn()
    render(<CategoriaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).not.toHaveBeenCalled()
  })
  it('guarda con código y nombre', () => {
    const onGuardar = vi.fn()
    render(<CategoriaFormModal onGuardar={onGuardar} onClose={() => {}} cargando={false} />)
    fireEvent.change(screen.getByLabelText(/código/i), { target: { value: 'C2' } })
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Bebidas' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(onGuardar).toHaveBeenCalledWith(expect.objectContaining({ codigo: 'C2', nombre: 'Bebidas' }))
  })
})
