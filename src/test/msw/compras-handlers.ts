// src/test/msw/compras-handlers.ts
import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'

export const proveedorEjemplo = {
  id: 1, nit: '06140101011011', tipoDocumentoNombre: 'NIT', nombre: 'Distribuidora El Sol',
  nombreComercial: 'El Sol', direccion: 'San Salvador', telefono: '2222-3333', email: 'ventas@elsol.com',
  contacto: 'Juan Pérez', sitioWeb: null, notas: null, activo: true,
  totalCompras: 3, montoTotalCompras: 1200, ultimaCompra: '2026-06-20', fechaCreacion: '2026-01-10',
}

const proveedoresPage = { items: [proveedorEjemplo], totalItems: 1, pageNumber: 1, pageSize: 20, totalPages: 1 }

export const compraEjemplo = {
  id: 50, proveedorId: 1, proveedorNit: '06140101011011', proveedorNombre: 'Distribuidora El Sol',
  sucursalId: 1, sucursalNombre: 'Casa Matriz', numeroFactura: 'F-001', fechaEmision: '2026-06-20', fechaRegistro: '2026-06-20',
  subtotal: 100, iva: 13, total: 113, estado: 'BORRADOR', fechaConfirmacion: null, fechaAnulacion: null,
  observaciones: null, origen: 'MANUAL', codigoGeneracionDte: null, selloRecibidoDte: null, tipoDte: null, numeroControlDte: null,
  detalles: [{ id: 1, compraExternaId: 50, productoId: 3, productoCodigo: 'P001', productoNombre: 'Producto A', bodegaId: 1, bodegaNombre: 'Bodega Principal', cantidad: 2, costoUnitario: 50, subtotal: 100, iva: 13, total: 113, esParaInventario: true }],
  gastos: [], totalProductosInventario: 113, totalGastosAdministrativos: 0, cantidadItems: 1,
}

const comprasPage = { items: [compraEjemplo], totalItems: 1, pageNumber: 1, pageSize: 20, totalPages: 1 }

export const comprasHandlers = [
  http.get(`${base}/proveedores`, () => HttpResponse.json(proveedoresPage)),
  http.get(`${base}/proveedores/:id`, () => HttpResponse.json(proveedorEjemplo)),
  http.post(`${base}/proveedores`, async ({ request }) => {
    const b = (await request.json()) as { nit: string; nombre: string }
    return HttpResponse.json({ ...proveedorEjemplo, id: 99, nit: b.nit, nombre: b.nombre }, { status: 201 })
  }),
  http.put(`${base}/proveedores/:id`, async ({ request, params }) => {
    const b = (await request.json()) as { nit: string; nombre: string; activo: boolean }
    return HttpResponse.json({ ...proveedorEjemplo, id: Number(params.id), nit: b.nit, nombre: b.nombre, activo: b.activo })
  }),
  http.patch(`${base}/proveedores/:id/estado`, () => new HttpResponse(null, { status: 204 })),
  http.delete(`${base}/proveedores/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${base}/tiposgasto`, () => HttpResponse.json({
    items: [{ id: 1, codigo: 'FLE', nombre: 'Flete', descripcion: null, activo: true }],
    totalItems: 1, pageNumber: 1, pageSize: 100, totalPages: 1,
  })),
  http.get(`${base}/comprasexternas`, () => HttpResponse.json(comprasPage)),
  http.get(`${base}/comprasexternas/:id`, () => HttpResponse.json(compraEjemplo)),
  http.post(`${base}/comprasexternas`, async ({ request }) => {
    const b = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...compraEjemplo, id: 51, ...b, estado: 'BORRADOR' }, { status: 201 })
  }),
  http.put(`${base}/comprasexternas/:id`, () => HttpResponse.json({ ...compraEjemplo, estado: 'BORRADOR' })),
  http.put(`${base}/comprasexternas/:id/editar-confirmada`, () => HttpResponse.json({ ...compraEjemplo, estado: 'CONFIRMADA' })),
  http.post(`${base}/comprasexternas/:id/confirmar`, () => HttpResponse.json({ ...compraEjemplo, estado: 'CONFIRMADA', fechaConfirmacion: '2026-06-21' })),
  http.post(`${base}/comprasexternas/:id/anular`, () => HttpResponse.json({ ...compraEjemplo, estado: 'ANULADA', fechaAnulacion: '2026-06-22' })),
]
