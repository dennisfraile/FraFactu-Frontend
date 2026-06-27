// src/test/msw/dtes-recibidos-handlers.ts
import { http, HttpResponse } from 'msw'

const base = 'http://localhost:8080/api'

const jsonDteEjemplo = JSON.stringify({
  identificacion: { tipoDte: '03', numeroControl: 'DTE-03-0001', codigoGeneracion: 'GUID-1', fecEmi: '2026-06-19' },
  emisor: { nit: '06141804941035', nrc: '1234567', nombre: 'DISTRIBUIDORA EL BUEN PRECIO' },
  receptor: { nit: '06140000000000', nombre: 'MI EMPRESA' },
  cuerpoDocumento: [
    { numItem: 1, codigo: 'PROD-001', uniMedida: 59, descripcion: 'Resma de papel bond carta', cantidad: 50, precioUni: 4.5, montoDescu: 0, ventaNoSuj: 0, ventaExenta: 0, ventaGravada: 225 },
  ],
  resumen: { totalGravada: 225, subTotal: 225, montoTotalOperacion: 254.25, totalPagar: 254.25 },
})

export const dteResumenEjemplo = {
  id: 7, codigoGeneracion: 'GUID-1', tipoDte: '03', numeroControl: 'DTE-03-0001',
  fechaEmision: '2026-06-19', emisorNit: '06141804941035', emisorNombre: 'DISTRIBUIDORA EL BUEN PRECIO',
  total: 254.25, estado: 'PENDIENTE', compraExternaId: null, fechaCreacion: '2026-06-20',
}

export const dteDetalleEjemplo = {
  ...dteResumenEjemplo, selloRecibido: 'SELLO-1', emisorNrc: '1234567',
  receptorNit: '06140000000000', receptorNombre: 'MI EMPRESA', jsonDte: jsonDteEjemplo,
  montoGravado: 225, montoExento: 0, montoNoSujeto: 0, subTotal: 225, iva: 29.25,
  motivoDescarte: null, emailOrigen: 'proveedor@x.com', fechaRecepcionEmail: '2026-06-19', fechaActualizacion: null,
}

const dtesPage = { items: [dteResumenEjemplo], total: 1, pagina: 1, tamanoPagina: 20, totalPaginas: 1 }

const estadisticasEjemplo = { totalPendientes: 1, totalVinculados: 0, totalDescartados: 0, total: 1, montoTotalPendientes: 254.25, ultimaLectura: '2026-06-20' }

const jobCompletado = {
  jobId: 1, estado: 'COMPLETADO', fechaCreacion: '2026-06-20', fechaInicio: '2026-06-20', fechaFin: '2026-06-20',
  correosProcesados: 5, dtesEncontrados: 3, dtesNuevos: 2, dtesDuplicados: 1, errores: 0, mensajeError: null,
  dtesIgnorados: 0, rangoDesde: null, rangoHasta: null, esAutomatico: false, terminado: true,
}

export const dtesRecibidosHandlers = [
  http.get(`${base}/dtesrecibidos`, () => HttpResponse.json(dtesPage)),
  http.get(`${base}/dtesrecibidos/estadisticas`, () => HttpResponse.json(estadisticasEjemplo)),
  http.get(`${base}/dtesrecibidos/leer-correo/estado`, () => HttpResponse.json(jobCompletado)),
  http.get(`${base}/dtesrecibidos/:id`, () => HttpResponse.json(dteDetalleEjemplo)),
  http.post(`${base}/dtesrecibidos/cargar-json`, () => HttpResponse.json({
    totalArchivos: 1, cargados: 1, duplicados: 0, rechazados: 0,
    resultados: [{ archivo: 'ccf.json', resultado: 'Cargado', codigoGeneracion: 'GUID-1', mensaje: 'OK' }],
  })),
  http.post(`${base}/dtesrecibidos/:id/descartar`, () => HttpResponse.json({ message: 'DTE descartado exitosamente' })),
  http.post(`${base}/dtesrecibidos/:id/mapear-y-crear-compra`, () => HttpResponse.json({
    compraId: 99, totalMapeado: 254.25, totalDte: 254.25, itemsProductos: 1, itemsGastos: 0, productosCreados: 0,
  })),
  http.post(`${base}/dtesrecibidos/leer-correo`, () => HttpResponse.json({ jobId: 1, estado: 'ENCOLADO', mensaje: 'Encolado' }, { status: 202 })),
  http.put(`${base}/dtesrecibidos/configuracion`, () => HttpResponse.json({ message: 'Configuración actualizada' })),
  http.post(`${base}/dtesrecibidos/probar-conexion`, () => HttpResponse.json({ exitoso: true, mensaje: 'Conexión OK' })),
  // Gmail / perfil
  http.get(`${base}/emisores/mi-perfil`, () => HttpResponse.json({ gmailEmail: null, gmailConectado: false, lecturaCorreoHabilitada: false, ultimaLecturaCorreo: null })),
  http.get(`${base}/emisores/gmail-connect`, () => HttpResponse.json({ authorizationUrl: 'https://accounts.google.com/o/oauth2/auth?x=1' })),
  http.post(`${base}/emisores/gmail-exchange-code`, () => HttpResponse.json({ success: true, email: 'cuenta@gmail.com' })),
  http.delete(`${base}/emisores/gmail-disconnect`, () => HttpResponse.json({ message: 'Cuenta de Gmail desconectada exitosamente' })),
]
