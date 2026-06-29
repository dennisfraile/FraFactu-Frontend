import { describe, it, expect } from 'vitest'
import { montoDeCuota, validarCuotas, construirDefiniciones, type CuotaDraft } from './cuotas'

const dos = (a: number, b: number): CuotaDraft[] => [
  { fechaPactada: '2026-07-01', valor: a },
  { fechaPactada: '2026-08-01', valor: b },
]

describe('montoDeCuota', () => {
  it('en modo monto devuelve el valor', () => {
    expect(montoDeCuota({ fechaPactada: '2026-07-01', valor: 40 }, 'monto', 100)).toBe(40)
  })
  it('en modo porcentaje aplica el % sobre el total', () => {
    expect(montoDeCuota({ fechaPactada: '2026-07-01', valor: 25 }, 'porcentaje', 200)).toBe(50)
  })
})

describe('validarCuotas', () => {
  it('exige al menos 2 cuotas', () => {
    expect(validarCuotas([{ fechaPactada: '2026-07-01', valor: 100 }], 'monto', 100))
      .toMatch(/al menos 2/i)
  })
  it('en modo monto exige que sumen el total (±0.01)', () => {
    expect(validarCuotas(dos(40, 50), 'monto', 100)).toMatch(/no coincide|suma/i)
    expect(validarCuotas(dos(40, 60), 'monto', 100)).toBeNull()
    expect(validarCuotas(dos(40, 60.005), 'monto', 100)).toBeNull() // tolerancia
  })
  it('en modo porcentaje exige que sumen 100', () => {
    expect(validarCuotas(dos(40, 50), 'porcentaje', 100)).toMatch(/100/)
    expect(validarCuotas(dos(40, 60), 'porcentaje', 100)).toBeNull()
  })
  it('exige fechas ascendentes', () => {
    const malas: CuotaDraft[] = [
      { fechaPactada: '2026-08-01', valor: 50 },
      { fechaPactada: '2026-07-01', valor: 50 },
    ]
    expect(validarCuotas(malas, 'monto', 100)).toMatch(/fecha/i)
  })
  it('exige valores positivos', () => {
    expect(validarCuotas(dos(0, 100), 'monto', 100)).toMatch(/mayor a 0|positiv/i)
  })
})

describe('construirDefiniciones', () => {
  it('numera correlativo desde 1 y usa monto en modo monto', () => {
    const defs = construirDefiniciones(dos(40, 60), 'monto')
    expect(defs).toEqual([
      { numero: 1, monto: 40, fechaPactada: '2026-07-01' },
      { numero: 2, monto: 60, fechaPactada: '2026-08-01' },
    ])
  })
  it('usa porcentaje en modo porcentaje', () => {
    const defs = construirDefiniciones(dos(40, 60), 'porcentaje')
    expect(defs[0]).toEqual({ numero: 1, porcentaje: 40, fechaPactada: '2026-07-01' })
  })
})
