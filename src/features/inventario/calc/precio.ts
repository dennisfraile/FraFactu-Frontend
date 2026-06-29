const r2 = (n: number) => Math.round(n * 100) / 100

export function precioConIva(neto: number, pct: number): number {
  return r2(neto * (1 + pct / 100))
}

export function precioSinIva(conIva: number, pct: number): number {
  return r2(conIva / (1 + pct / 100))
}
