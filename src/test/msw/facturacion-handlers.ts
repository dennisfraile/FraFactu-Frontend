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
  http.get(`${base}/catalogos/departamentos`, () => HttpResponse.json([{ id: 1, codigo: '06', valor: 'San Salvador' }])),
  http.get(`${base}/catalogos/municipios`, () => HttpResponse.json([{ id: 10, codigo: '14', valor: 'San Salvador Centro', codigoDepartamento: '06' }])),
  http.get(`${base}/catalogos/distritos`, () => HttpResponse.json([{ id: 100, codigo: '01', valor: 'San Salvador', codigoDepartamento: '06', codigoMunicipio: '14' }])),
  http.get(`${base}/catalogos/tipos-documento-identificacion-receptor`, () => HttpResponse.json([{ id: 1, codigo: '36', valor: 'NIT' }, { id: 2, codigo: '13', valor: 'DUI' }, { id: 4, codigo: '03', valor: 'Pasaporte' }])),
  http.get(`${base}/catalogos/actividades-economicas`, () => HttpResponse.json([{ id: 5, codigo: '01111', valor: 'Cultivo de cereales', esSeleccionable: true, padreId: null }])),
  http.post(`${base}/receptores`, async ({ request }) => {
    const b = (await request.json()) as { nombreRazonSocial: string; numeroDocumento?: string; nrc?: string; correoElectronico?: string }
    return HttpResponse.json({ id: 99, nombreRazonSocial: b.nombreRazonSocial, numeroDocumento: b.numeroDocumento ?? null, nrc: b.nrc ?? null, correoElectronico: b.correoElectronico ?? null }, { status: 201 })
  }),
  http.post(`${base}/facturas/guardar-pendiente`, () => HttpResponse.json(facturaResponse, { status: 201 })),
  http.post(`${base}/facturas`, () => HttpResponse.json(facturaResponse, { status: 201 })),
  http.get(`${base}/facturas/buscar-para-nc`, () => HttpResponse.json([
    { id: 8, numeroControl: 'DTE-03-...', codigoGeneracion: 'CCF-GUID-1', tipoDte: '03', tipoDocumentoNombre: 'CCF', fechaEmision: '2026-06-20', receptorNombre: 'Cliente Uno', receptorNumDocumento: '0614', montoTotalOperacion: 113, totalPagar: 113, estadoHacienda: 'PROCESADO', saldoDisponible: 113, montoAcreditado: 0, nceCount: 0 },
  ])),
  http.get(`${base}/facturas/buscar-para-nd`, () => HttpResponse.json([
    { id: 8, numeroControl: 'DTE-03-...', codigoGeneracion: 'CCF-GUID-1', tipoDte: '03', tipoDocumentoNombre: 'CCF', fechaEmision: '2026-06-20', receptorNombre: 'Cliente Uno', receptorNumDocumento: '0614', montoTotalOperacion: 113, totalPagar: 113, estadoHacienda: 'PROCESADO', saldoDisponible: 113, montoAcreditado: 0, nceCount: 0 },
  ])),
  http.get(`${base}/facturas/:id`, () => HttpResponse.json(facturaResponse)),
  http.get(`${base}/facturas`, () => HttpResponse.json({ items: [listItem], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 })),
  http.post(`${base}/facturas/:id/anular`, () => HttpResponse.json({ message: 'Factura anulada exitosamente', facturaId: 10 })),
  http.get(`${base}/facturas/:id/puede-invalidar`, () => HttpResponse.json({ puedeInvalidar: true, horasRestantes: 20, fechaLimite: '2026-06-24T23:59:59Z', mensaje: 'Puede invalidar.' })),
  http.get(`${base}/facturas/:id/detalle-para-nc`, () => HttpResponse.json({
    id: 8, numeroControl: 'DTE-03-...', codigoGeneracion: 'CCF-GUID-1', tipoDte: '03', fechaEmision: '2026-06-20', condicionOperacion: 1,
    receptorId: 7, receptorNombre: 'Cliente Uno', receptorNumDocumento: '0614', receptorNit: '0614', receptorNrc: '123-4', receptorCorreo: 'c@x.com', receptorTelefono: '2222',
    totalGravada: 100, totalExenta: 0, totalNoSuj: 0, subTotal: 100, totalIva: 13, montoTotalOperacion: 113, totalPagar: 113,
    saldoDisponible: 113, montoAcreditado: 0, nceCount: 0,
    items: [{ numItem: 1, tipoItem: 1, codigo: 'P001', descripcion: 'Producto A', cantidad: 2, precioUnitario: 50, ventaGravada: 100, ventaExenta: 0, ventaNoSuj: 0, montoDescuento: 0, ivaItem: 13, unidadMedida: 39, numeroDocumentoRelacionado: null }],
  })),
  http.get(`${base}/facturas/:id/detalle-para-nd`, () => HttpResponse.json({
    id: 8, numeroControl: 'DTE-03-...', codigoGeneracion: 'CCF-GUID-1', tipoDte: '03', fechaEmision: '2026-06-20', condicionOperacion: 1,
    receptorId: 7, receptorNombre: 'Cliente Uno', receptorNumDocumento: '0614', receptorNit: '0614', receptorNrc: '123-4', receptorCorreo: 'c@x.com', receptorTelefono: '2222',
    totalGravada: 100, totalExenta: 0, totalNoSuj: 0, subTotal: 100, totalIva: 13, montoTotalOperacion: 113, totalPagar: 113,
    saldoDisponible: 113, montoAcreditado: 0, nceCount: 0, items: [],
  })),
]
