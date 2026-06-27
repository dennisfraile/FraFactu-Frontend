// src/features/dtes-recibidos/calc/mapeo.ts (se completa en Task 3)
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
