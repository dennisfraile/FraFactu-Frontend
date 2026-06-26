// src/features/compras/pages/desdeCompra.test.ts
// Pure (no rendering) round-trip test: desdeCompra → buildCrearCompraDto
import { describe, it, expect } from 'vitest'
import { desdeCompra } from '../desdeCompra'
import { buildCrearCompraDto } from '../mappers'
import type { CompraExternaDto } from '../types'

const compra: CompraExternaDto = {
  id: 99,
  proveedorId: 7,
  proveedorNit: '0614-010101-001-1',
  proveedorNombre: 'Proveedor Test',
  sucursalId: 1,
  sucursalNombre: 'Sucursal Central',
  numeroFactura: 'F-TEST-001',
  fechaEmision: '2026-06-01T00:00:00',
  fechaRegistro: '2026-06-01T12:00:00',
  subtotal: 120,
  iva: 13,
  total: 133,
  estado: 'BORRADOR',
  observaciones: null,
  origen: 'MANUAL',
  codigoGeneracionDte: null,
  selloRecibidoDte: null,
  tipoDte: null,
  numeroControlDte: null,
  totalProductosInventario: 113,
  totalGastosAdministrativos: 20,
  cantidadItems: 1,
  detalles: [
    {
      id: 1,
      compraExternaId: 99,
      productoId: 3,
      productoCodigo: 'PROD-03',
      productoNombre: 'Producto A',
      bodegaId: 1,
      bodegaNombre: 'Bodega Principal',
      cantidad: 2,
      costoUnitario: 50,
      subtotal: 100,
      iva: 13,
      total: 113,
      esParaInventario: true,
    },
  ],
  gastos: [
    {
      id: 1,
      compraExternaId: 99,
      catTipoGastoId: null,
      tipoGastoNombre: null,
      descripcion: 'Flete',
      monto: 20,
      centroCosto: null,
      cuentaContable: null,
      fechaCreacion: '2026-06-01T12:00:00',
    },
  ],
}

describe('desdeCompra → buildCrearCompraDto (round-trip)', () => {
  it('cada línea producto tiene un uid numérico', () => {
    const values = desdeCompra(compra)
    for (const p of values.productos) {
      expect(typeof p.uid).toBe('number')
    }
  })

  it('el DTO reconstruido NO contiene uid en detalles ni gastos', () => {
    const values = desdeCompra(compra)
    const dto = buildCrearCompraDto(values)
    expect(Object.keys(dto.detalles[0])).not.toContain('uid')
    expect(Object.keys(dto.gastos[0])).not.toContain('uid')
  })

  it('los totales del DTO coinciden con los de la compra original', () => {
    const values = desdeCompra(compra)
    const dto = buildCrearCompraDto(values)
    expect(dto.subtotal).toBe(120)
    expect(dto.iva).toBe(13)
    expect(dto.total).toBe(133)
  })

  it('Σ(detalle.total) + Σ(gasto.monto) === dto.total', () => {
    const values = desdeCompra(compra)
    const dto = buildCrearCompraDto(values)
    const sumDetalles = dto.detalles.reduce((s, d) => s + d.total, 0)
    const sumGastos = dto.gastos.reduce((s, g) => s + g.monto, 0)
    expect(sumDetalles + sumGastos).toBe(dto.total)
  })
})
