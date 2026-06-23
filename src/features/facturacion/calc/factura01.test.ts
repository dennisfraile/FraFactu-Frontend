import { describe, it, expect } from 'vitest'
import { calcularItemFactura01, calcularResumenFactura01, pagosCuadran } from './factura01'

describe('calcularItemFactura01 (precio IVA-incluido)', () => {
  it('ítem gravado: extrae IVA inverso', () => {
    const r = calcularItemFactura01({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(113)
    expect(r.ivaItem).toBe(13) // 113/1.13*0.13
    expect(r.ventaExenta).toBe(0)
    expect(r.ventaNoSuj).toBe(0)
  })
  it('aplica descuento de línea antes del IVA', () => {
    const r = calcularItemFactura01({ cantidad: 1, precioUni: 113, montoDescuento: 13, tipoImpuesto: 1 })
    expect(r.ventaGravada).toBe(100)
    expect(r.ivaItem).toBe(11.5)
  })
  it('ítem exento: sin IVA', () => {
    const r = calcularItemFactura01({ cantidad: 3, precioUni: 10, tipoImpuesto: 2 })
    expect(r.ventaExenta).toBe(30)
    expect(r.ventaGravada).toBe(0)
    expect(r.ivaItem).toBe(0)
  })
  it('ítem no sujeto', () => {
    const r = calcularItemFactura01({ cantidad: 1, precioUni: 50, tipoImpuesto: 3 })
    expect(r.ventaNoSuj).toBe(50)
    expect(r.ivaItem).toBe(0)
  })
})

describe('calcularResumenFactura01', () => {
  it('suma totales y mantiene IVA incluido en el total', () => {
    const items = [
      calcularItemFactura01({ cantidad: 2, precioUni: 56.5, tipoImpuesto: 1 }), // gravada 113, iva 13
      calcularItemFactura01({ cantidad: 3, precioUni: 10, tipoImpuesto: 2 }), // exenta 30
    ]
    const r = calcularResumenFactura01(items)
    expect(r.totalGravada).toBe(113)
    expect(r.totalExenta).toBe(30)
    expect(r.totalNoSuj).toBe(0)
    expect(r.totalIva).toBe(13)
    expect(r.subTotal).toBe(143)
    expect(r.totalPagar).toBe(143) // el IVA ya está incluido en la gravada
  })
})

describe('pagosCuadran', () => {
  it('true cuando la suma de pagos iguala el total', () => {
    expect(pagosCuadran([100, 43], 143)).toBe(true)
  })
  it('false cuando no cuadra', () => {
    expect(pagosCuadran([100], 143)).toBe(false)
  })
  it('tolera ruido de coma flotante', () => {
    expect(pagosCuadran([0.1, 0.2], 0.3)).toBe(true)
  })
})
