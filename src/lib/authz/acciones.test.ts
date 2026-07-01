import { describe, it, expect } from 'vitest'
import * as A from './acciones'

describe('matriz de acciones (espejo del backend)', () => {
  it('facturación', () => {
    expect(A.FACTURA_CREAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Cajero'])
    expect(A.FACTURA_ANULAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
  })
  it('compras y proveedores incluyen Contador, no Cajero', () => {
    expect(A.COMPRA_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Contador'])
    expect(A.PROVEEDOR_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Contador'])
    expect(A.COMPRA_ESCRIBIR).not.toContain('Cajero')
  })
  it('cxc: pagar incluye Cajero, refinanciar no', () => {
    expect(A.CXC_PAGAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'Cajero'])
    expect(A.CXC_REFINANCIAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
  })
  it('inventario', () => {
    expect(A.PRODUCTO_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.CATALOGO_ESCRIBIR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.CATALOGO_ELIMINAR).toEqual(['EmisorAdmin'])
    expect(A.INVENTARIO_AJUSTAR).toEqual(['EmisorAdmin', 'GerenteSucursal', 'EncargadoInventario'])
  })
  it('dtes recibidos: escritura sin Contador, config solo EmisorAdmin', () => {
    expect(A.DTE_RECIBIDO_GESTIONAR).toEqual(['EmisorAdmin', 'GerenteSucursal'])
    expect(A.DTE_RECIBIDO_CONFIG).toEqual(['EmisorAdmin'])
  })
  it('usuarios (Entrega A)', () => {
    expect(A.USUARIOS_ESCRIBIR).toEqual(['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal'])
  })
  it('SuperAdmin NO aparece en gates de features operativos', () => {
    for (const c of [A.FACTURA_CREAR, A.FACTURA_ANULAR, A.COMPRA_ESCRIBIR, A.CXC_PAGAR, A.PRODUCTO_ESCRIBIR, A.INVENTARIO_AJUSTAR]) {
      expect(c).not.toContain('SuperAdmin')
    }
  })
})
