import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'

const facturaResponse = {
  id: 10,
  codigoGeneracion: 'ABC-123',
  numeroControl: 'DTE-01-00000000-000000000000001',
  selloRecepcion: null,
  estado: 'PENDIENTE',
  estadoHacienda: 'PENDIENTE',
  identificacion: { version: 1, tipoDte: '01', tipoModelo: 1, tipoOperacion: 1, crearEventoAutomatico: false, fechaEmision: '2026-06-23', horaEmision: '14:30:00', tipoMoneda: 'USD' },
  receptor: null,
  cuerpoDocumento: [{ numItem: 1, tipoItem: 1, cantidad: 2, uniMedida: 59, descripcion: 'Producto A', precioUni: 56.5, montoDescuento: 0, ventaGravada: 113, ventaExenta: 0, ventaNoSuj: 0, ivaItem: 13 }],
  resumen: { totalNoSuj: 0, totalExenta: 0, totalGravada: 113, subTotal: 113, totalIva: 13, totalPagar: 113, totalLetras: 'CIENTO TRECE DÓLARES CON 00/100', condicionOperacion: 1, pagos: [{ catFormaPagoId: 1, monto: 113 }] },
  fechaEmision: '2026-06-23',
}

const listItem = {
  id: 10, numeroControl: 'DTE-01-00000000-000000000000001', codigoGeneracion: 'ABC-123',
  fechaEmision: '2026-06-23', tipoDte: '01', tipoDocumento: 'Factura', receptorNombre: 'Consumidor Final',
  receptorNumeroDocumento: '', totalPagar: 113, estadoHacienda: 'PENDIENTE', selloRecepcion: null, ambiente: '00',
}

export const facturacionHandlers = [
  http.get(`${base}/catalogos/unidades-medida`, () => HttpResponse.json([{ id: 59, codigo: '59', valor: 'Unidad' }])),
  http.get(`${base}/catalogos/tipos-items`, () => HttpResponse.json([{ id: 1, codigo: '1', valor: 'Bien' }, { id: 2, codigo: '2', valor: 'Servicio' }])),
  http.get(`${base}/catalogos/formas-pago`, () => HttpResponse.json([{ id: 1, codigo: '01', valor: 'Billetes y monedas' }])),
  http.get(`${base}/catalogos/condiciones-operacione`, () => HttpResponse.json([{ id: 1, codigo: '1', valor: 'Contado' }, { id: 2, codigo: '2', valor: 'Crédito' }])),
  http.get(`${base}/sucursales/todas-activas`, () => HttpResponse.json([{ id: 1, nombre: 'Casa Matriz' }])),
  http.get(`${base}/vendedores`, () => HttpResponse.json([{ id: 1, codigo: 'V01', nombre: 'Vendedor Uno', activo: true }])),
  http.get(`${base}/receptores/search`, () => HttpResponse.json([{ id: 7, tipoDocumentoNombre: 'NIT', numeroDocumento: '0614-...', nombreRazonSocial: 'Cliente Uno', correoElectronico: 'c@x.com', nrc: '123-4' }])),
  http.get(`${base}/productosservicios/search`, () => HttpResponse.json([{ id: 3, codigo: 'P001', nombre: 'Producto A', precioVenta: 56.5, unidadMedida: '59', tipoItem: 'Bien', tipoImpuesto: 1, precioIncluyeIva: true }])),
  http.get(`${base}/cajas`, () => HttpResponse.json([{ id: 1, sucursalId: 1, codigo: 'P001', nombre: 'Caja Principal', activo: true, codPuntoVenta: 'P001', codPuntoVentaMH: '01' }])),
  http.get(`${base}/bodegas/sucursal/:sucursalId`, () => HttpResponse.json([{ id: 1, codigo: 'BOD-01', nombre: 'Bodega Principal', sucursalId: 1, esPrincipal: true, activa: true }])),
  http.post(`${base}/facturas/guardar-pendiente`, () => HttpResponse.json(facturaResponse, { status: 201 })),
  http.post(`${base}/facturas`, () => HttpResponse.json(facturaResponse, { status: 201 })),
  http.get(`${base}/facturas/:id`, () => HttpResponse.json(facturaResponse)),
  http.get(`${base}/facturas`, () => HttpResponse.json({ items: [listItem], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 })),
  http.post(`${base}/facturas/:id/anular`, () => HttpResponse.json({ message: 'Factura anulada exitosamente', facturaId: 10 })),
  http.get(`${base}/facturas/:id/puede-invalidar`, () => HttpResponse.json({ puedeInvalidar: true, horasRestantes: 20, fechaLimite: '2026-06-24T23:59:59Z', mensaje: 'Puede invalidar.' })),
]
