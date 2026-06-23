// src/features/facturacion/catalogos.ts
// Códigos MH usados en F5.1 (Factura 01).

export const TIPO_DTE = { FACTURA: '01', CCF: '03', NC: '05', ND: '06', FSE: '14' } as const

export const COND_OPERACION = { CONTADO: 1, CREDITO: 2, OTRO: 3 } as const

export const TIPO_ITEM = { BIEN: 1, SERVICIO: 2, AMBOS: 3, OTROS: 4 } as const

export const TIPO_IMPUESTO = { GRAVADO: 1, EXENTO: 2, NO_SUJETO: 3 } as const

// Identificación por defecto para una Factura 01 en modo PENDIENTE (sin MH).
export const IDENTIFICACION_FACTURA_DEFAULT = {
  version: 1,
  tipoDte: TIPO_DTE.FACTURA,
  tipoModelo: 1, // Previo
  tipoOperacion: 1, // Normal
  crearEventoAutomatico: false, // F5.1: no transmite a MH
  tipoMoneda: 'USD',
} as const
