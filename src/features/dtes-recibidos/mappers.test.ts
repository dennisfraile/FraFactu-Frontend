import { describe, it, expect } from 'vitest'
import { lineaDesdeParsed, buildMapearDto, type MapeoFormValues } from './mappers'
import type { DteLineaParsed } from './parse'

const linea: DteLineaParsed = {
  numItem: 1, codigo: 'P-1', descripcion: 'Papel', cantidad: 50, precioUnitario: 4.5,
  montoDescuento: 0, ventaGravada: 225, ventaExenta: 0, ventaNoSujeta: 0, unidadMedida: 59,
  montoNeto: 225, montoConIva: 254.25,
}

describe('lineaDesdeParsed', () => {
  it('siembra una línea como GASTO con monto y costo por defecto', () => {
    const l = lineaDesdeParsed(linea)
    expect(l.accion).toBe('GASTO')
    expect(l.descripcionDte).toBe('Papel')
    expect(l.montoDte).toBe(254.25)
    expect(l.cantidad).toBe(50)
    expect(l.costoUnitario).toBe(4.50) // round2(225/50) — costo NETO (sin IVA)
  })
})

describe('buildMapearDto', () => {
  it('arma items por acción', () => {
    const values: MapeoFormValues = {
      sucursalId: 2,
      lineas: [
        { ...lineaDesdeParsed(linea), accion: 'PRODUCTO_EXISTENTE', productoId: 10, bodegaId: 3, cantidad: 50, costoUnitario: 5.085 },
        { ...lineaDesdeParsed(linea), uid: 99, accion: 'GASTO', montoDte: 30 },
      ],
    }
    const dto = buildMapearDto(values)
    expect(dto.sucursalId).toBe(2)
    expect(dto.items[0]).toMatchObject({ accion: 'PRODUCTO_EXISTENTE', productoId: 10, bodegaId: 3, cantidad: 50, costoUnitario: 5.085 })
    expect(dto.items[1]).toMatchObject({ accion: 'GASTO', montoDte: 30 })
    expect(dto.items[1].productoId).toBeUndefined()
  })

  it('mapea PRODUCTO_NUEVO con su subobjeto', () => {
    const base = lineaDesdeParsed(linea)
    const values: MapeoFormValues = {
      sucursalId: 2,
      lineas: [{ ...base, accion: 'PRODUCTO_NUEVO', bodegaId: 3, cantidad: 50, costoUnitario: 5.085, nuevo: { ...base.nuevo, codigo: 'X', nombre: 'Nuevo', catTipoItemId: 1, catUnidadMedidaId: 59 } }],
    }
    const dto = buildMapearDto(values)
    expect(dto.items[0].productoNuevo).toMatchObject({ codigo: 'X', nombre: 'Nuevo', catTipoItemId: 1, catUnidadMedidaId: 59, tipoInventario: 0 })
  })
})
