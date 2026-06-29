import { describe, it, expect } from 'vitest'
import type { CrearProductoDto, StockPorBodega, KardexProducto } from './types'
import { MOTIVOS_AJUSTE, TIPO_INVENTARIO } from './types'

describe('tipos inventario', () => {
  it('CrearProductoDto admite la forma del backend', () => {
    const dto: CrearProductoDto = {
      codigo: 'P002', nombre: 'Tornillo', precioVenta: 1.5, catUnidadMedidaId: 39,
      catTipoItemId: 1, tipoImpuesto: 1, precioIncluyeIva: false, costoIncluyeIva: false,
      tipoInventario: 0, accesoTodasSucursales: true,
    }
    expect(dto.codigo).toBe('P002')
  })
  it('StockPorBodega y KardexProducto compilan', () => {
    const s: StockPorBodega = {
      productoId: 1, productoCodigo: 'P001', productoNombre: 'X', bodegaId: 1, bodegaNombre: 'B',
      sucursalNombre: 'S', cantidadDisponible: 5, cantidadReservada: 0, cantidadTotal: 5,
      costoPromedio: 10, valorStock: 50, fechaUltimoMovimiento: null, stockMinimo: 1, stockMaximo: 100,
    }
    const k: Pick<KardexProducto, 'saldoFinal'> = { saldoFinal: 5 }
    expect(s.cantidadTotal + k.saldoFinal).toBe(10)
  })
  it('catálogos de UI', () => {
    expect(MOTIVOS_AJUSTE).toContain('MERMA')
    expect(TIPO_INVENTARIO.MOBILIARIO_EQUIPO).toBe(1)
  })
})
