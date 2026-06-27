import { describe, it, expect } from 'vitest'
import { parseDteLineas } from './parse'

const json = JSON.stringify({
  cuerpoDocumento: [
    { numItem: 1, codigo: 'P-1', uniMedida: 59, descripcion: 'Papel bond', cantidad: 50, precioUni: 4.5, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 225 },
    { numItem: 2, codigo: null, descripcion: 'Flete', cantidad: 1, precioUni: 10, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 10 },
  ],
})

describe('parseDteLineas', () => {
  it('parsea cada ítem del cuerpo del documento', () => {
    const lineas = parseDteLineas(json)
    expect(lineas).toHaveLength(2)
    expect(lineas[0]).toMatchObject({ numItem: 1, codigo: 'P-1', descripcion: 'Papel bond', cantidad: 50, precioUnitario: 4.5, ventaGravada: 225, unidadMedida: 59 })
    // montoConIva = round2(225*1.13) = 254.25
    expect(lineas[0].montoConIva).toBe(254.25)
  })

  it('devuelve [] ante JSON inválido o sin cuerpo', () => {
    expect(parseDteLineas('no-json')).toEqual([])
    expect(parseDteLineas(JSON.stringify({}))).toEqual([])
  })
})
