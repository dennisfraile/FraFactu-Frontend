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
}

export interface ResumenNumerico {
  totalGravada: number
  totalExenta: number
  totalNoSuj: number
  totalIva: number
  subTotal: number
  totalPagar: number
}
