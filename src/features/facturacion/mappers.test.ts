import { describe, it, expect } from 'vitest'
import { buildCreateFacturaDto, type FacturaFormValues } from './mappers'

const base: FacturaFormValues = {
  sucursalId: 1,
  cajaId: 5,
  esConsumidorFinal: true,
  receptorId: null,
  vendedorId: null,
  condicionOperacion: 1,
  items: [
    // uniMedida es el Id de catálogo (no el código MH).
    { descripcion: 'Producto A', cantidad: 2, precioUni: 56.5, uniMedida: 39, tipoItem: 1, tipoImpuesto: 1, bodegaId: 2 },
  ],
  pagos: [{ catFormaPagoId: 1, monto: 113 }],
}

describe('buildCreateFacturaDto', () => {
  it('arma el DTO de Factura 01 con identificación PENDIENTE (version 2 + placeholders)', () => {
    const dto = buildCreateFacturaDto(base, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.identificacion.tipoDte).toBe('01')
    expect(dto.identificacion.version).toBe(2)
    expect(dto.identificacion.crearEventoAutomatico).toBe(false)
    expect(dto.identificacion.fechaEmision).toBe('2026-06-23')
    // numeroControl con formato válido y codigoGeneracion como GUID de 36 chars.
    expect(dto.identificacion.numeroControl).toMatch(/^DTE-01-(M|B|S|P)\d{3}P\d{3}-\d{15}$/)
    expect(dto.identificacion.codigoGeneracion).toHaveLength(36)
    expect(dto.cajaId).toBe(5)
    expect(dto.sucursalId).toBe(1)
    // Consumidor Final: receptor inline, sin receptorId.
    expect(dto.receptorId).toBeNull()
    expect(dto.receptor).toEqual({ nombre: 'Consumidor Final' })
    // El detalle conserva bodegaId y uniMedida (Id de catálogo).
    expect(dto.cuerpoDocumento[0].bodegaId).toBe(2)
    expect(dto.cuerpoDocumento[0].uniMedida).toBe(39)
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

  it('sin receptor (no consumidor final pero sin receptorId) cae a Consumidor Final inline', () => {
    const dto = buildCreateFacturaDto({ ...base, esConsumidorFinal: false, receptorId: null }, { fecha: '2026-06-23', hora: '14:30:00' })
    expect(dto.receptorId).toBeNull()
    expect(dto.receptor).toEqual({ nombre: 'Consumidor Final' })
  })
})
