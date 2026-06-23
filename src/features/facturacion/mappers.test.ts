import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from './mappers'

const base: FacturaFormValues = {
  sucursalId: 1,
  esConsumidorFinal: true,
  receptorId: null,
  vendedorId: null,
  condicionOperacion: 1,
  items: [
    { descripcion: 'Producto A', cantidad: 2, precioUni: 56.5, uniMedida: 59, tipoItem: 1, tipoImpuesto: 1 },
  ],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('buildCreateFacturaDto', () => {
  it('arma el DTO de Factura 01 con identificación PENDIENTE', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.identificacion.tipoDte).toBe('01')
    expect(dto.identificacion.crearEventoAutomatico).toBe(false)
    expect(dto.identificacion.fechaEmision).toBe('2026-06-23')
    expect(dto.sucursalId).toBe(1)
    expect(dto.receptorId).toBeNull()
    expect(dto.receptor).toBeNull()
  })
  it('calcula cuerpo y resumen coherentes', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.cuerpoDocumento[0].ventaGravada).toBe(113)
    expect(dto.cuerpoDocumento[0].ivaItem).toBe(13)
    expect(dto.cuerpoDocumento[0].numItem).toBe(1)
    expect(dto.resumen.totalGravada).toBe(113)
    expect(dto.resumen.totalIva).toBe(13)
    expect(dto.resumen.totalPagar).toBe(113)
    expect(dto.resumen.totalLetras).toBe('CIENTO TRECE DÓLARES CON 00/100')
    expect(dto.resumen.pagos[0].monto).toBe(113)
  })
  it('con receptor registrado envía receptorId y no receptor inline', () => {
    const dto = buildCreateFacturaDto({ ...base, esConsumidorFinal: false, receptorId: 7 }, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.receptorId).toBe(7)
    expect(dto.receptor).toBeNull()
  })
})
