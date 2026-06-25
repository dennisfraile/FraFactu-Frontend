export type TipoImpuesto = 1 | 2 | 3 // 1=Gravado, 2=Exento, 3=NoSujeto

export interface ItemInput {
  cantidad: number
  precioUni: number
  montoDescuento?: number
  tipoImpuesto: TipoImpuesto
}

export interface ItemCalculado {
  ventaGravada: number
  ventaExenta: number
  ventaNoSuj: number
  ivaItem: number
  // F5.2 FSE (14): monto de compra a sujeto excluido y descuento de línea
  // (se propaga para agregar TotalCompras/Descu en el resumen).
  compra?: number
  montoDescuento?: number
}

export interface ResumenNumerico {
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  totalIva: number
  subTotal: number
  totalPagar: number
  // F5.2 CCF (03): IVA neto sumado.
  montoTotalOperacion?: number
  // F5.2 FSE (14): compras y retenciones.
  totalCompras?: number
  descu?: number
  ivaRete1?: number
  reteRenta?: number
}
