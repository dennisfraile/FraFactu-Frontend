// Convierte un monto USD a letras en español (formato MH: "... DÓLARES CON NN/100").
import { round } from './round'

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const ESPECIALES: Record<number, string> = {
  10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
  16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
  20: 'VEINTE', 21: 'VEINTIUN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
  25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE',
}
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function menorQueCien(n: number): string {
  if (n < 10) return UNIDADES[n]
  if (ESPECIALES[n]) return ESPECIALES[n]
  const d = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`
}

function menorQueMil(n: number): string {
  if (n === 100) return 'CIEN'
  const c = Math.floor(n / 100)
  const resto = n % 100
  const centena = CENTENAS[c]
  const restoTxt = resto === 0 ? '' : menorQueCien(resto)
  return [centena, restoTxt].filter(Boolean).join(' ')
}

function enteroALetras(n: number): string {
  if (n === 0) return 'CERO'
  if (n === 1) return 'UN'
  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000
  const partes: string[] = []
  if (millones > 0) partes.push(millones === 1 ? 'UN MILLÓN' : `${menorQueMil(millones)} MILLONES`)
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${menorQueMil(miles)} MIL`)
  if (resto > 0) partes.push(menorQueMil(resto))
  return partes.join(' ')
}

export function numeroALetras(monto: number): string {
  const valor = round(monto, 2)
  const entero = Math.floor(valor)
  const centavos = Math.round((valor - entero) * 100)
  const centavosTxt = String(centavos).padStart(2, '0')
  const moneda = entero === 1 ? 'DÓLAR' : 'DÓLARES'
  return `${enteroALetras(entero)} ${moneda} CON ${centavosTxt}/100`
}
