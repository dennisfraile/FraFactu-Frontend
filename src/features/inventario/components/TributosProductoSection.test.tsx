// src/features/inventario/components/TributosProductoSection.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TributosProductoSection } from './TributosProductoSection'

describe('TributosProductoSection', () => {
  it('agrega una fila de tributo', () => {
    const onChange = vi.fn()
    render(<TributosProductoSection tributos={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /agregar tributo/i }))
    expect(onChange).toHaveBeenCalledWith([{ codigo: '', tipoCalculo: 'porcentaje', valor: 0 }])
  })
})
