// Redondeo "half away from zero" estable, evitando el sesgo binario de toFixed.
export function round(n: number, decimales = 2): number {
  const factor = Math.pow(10, decimales)
  return Math.round((n + Number.EPSILON) * factor) / factor
}

export function round8(n: number): number {
  return round(n, 8)
}
