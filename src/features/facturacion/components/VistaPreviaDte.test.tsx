// src/features/facturacion/components/VistaPreviaDte.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VistaPreviaDte } from './VistaPreviaDte'
import type { CreateFacturaDto } from '../types'

const dto: CreateFacturaDto = {
  identificacion: { version: 1, tipoDte: '01', tipoModelo: 1, tipoOperacion: 1, crearEventoAutomatico: false, fechaEmision: '2026-06-23', horaEmision: '14:30:00', tipoMoneda: 'USD' },
  sucursalId: 1, receptorId: null, receptor: null, vendedorId: null,
  cuerpoDocumento: [{ numItem: 1, tipoItem: 1, cantidad: 2, uniMedida: 59, descripcion: 'Producto A', precioUni: 56.5, montoDescuento: 0, ventaGravada: 113, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 13 }],
  resumen: { totalNoSuj: 0, totalExenta: 0, totalGravada: 113, subTotal: 113, totalIva: 13, totalPagar: 113, totalLetras: 'CIENTO TRECE DÓLARES CON 00/100', condicionOperacion: 1, pagos: [{ catFormaPagoId: 1, monto: 113 }] },
}

describe('VistaPreviaDte', () => {
  it('muestra ítems, total y total en letras', () => {
    render(<VistaPreviaDte dto={dto} ambiente="00" />)
    expect(screen.getByText('Producto A')).toBeInTheDocument()
    // $113.00 aparece 3 veces: ventaGravada (fila), totalGravada y totalPagar (resumen).
    expect(screen.getAllByText('$113.00')).toHaveLength(3)
    expect(screen.getByText(/CIENTO TRECE/)).toBeInTheDocument()
  })
})
