// src/features/facturacion/catalogos.ts
// Códigos MH usados en F5.1 (Factura 01).

export const TIPO_DTE = { FACTURA: '01', CCF: '03', NC: '05', ND: '06', FSE: '14' } as const

export const COND_OPERACION = { CONTADO: 1, CREDITO: 2, OTRO: 3 } as const

export const TIPO_ITEM = { BIEN: 1, SERVICIO: 2, AMBOS: 3, OTROS: 4 } as const

export const TIPO_IMPUESTO = { GRAVADO: 1, EXENTO: 2, NO_SUJETO: 3 } as const

// Placeholders de numeroControl/codigoGeneracion: el validador del backend los exige,
// pero el servicio los regenera al persistir (en modo PENDIENTE se descartan). Deben
// cumplir el formato: numeroControl = DTE-{tipoDte}-(M|B|S|P)###P###-{15 dígitos} (31 chars);
// codigoGeneracion = GUID de 36 caracteres ([A-F0-9]).
export const NUMERO_CONTROL_PLACEHOLDER = 'DTE-01-M001P001-000000000000000'
export const CODIGO_GENERACION_PLACEHOLDER = '00000000-0000-0000-0000-000000000000'

// Identificación por defecto para una Factura 01 en modo PENDIENTE (sin MH).
// version=2 es la exigida por el backend para tipoDte '01' (Normativa MH V2.0).
export const IDENTIFICACION_FACTURA_DEFAULT = {
  version: 2,
  tipoDte: TIPO_DTE.FACTURA,
  tipoModelo: 1, // Previo
  tipoOperacion: 1, // Normal
  crearEventoAutomatico: false, // F5.1: no transmite a MH (se usa el endpoint guardar-pendiente)
  tipoMoneda: 'USD',
} as const
