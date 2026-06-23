import { describe, it, expect } from 'vitest'
import { decodeJwt, isExpired, getClaims } from './jwt'

// header.payload.signature con payload base64url. Helper para construir tokens.
function makeToken(payload: Record<string, unknown>): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`
}

describe('decodeJwt', () => {
  it('decodifica el payload', () => {
    const t = makeToken({ sub: '7', pwd_change_required: true, exp: 9999999999 })
    expect(decodeJwt(t)).toMatchObject({ sub: '7', pwd_change_required: true })
  })
  it('devuelve null ante un token malformado', () => {
    expect(decodeJwt('no-es-un-jwt')).toBeNull()
    expect(decodeJwt('')).toBeNull()
  })
})

describe('isExpired', () => {
  it('true si exp ya pasó', () => {
    expect(isExpired(makeToken({ exp: 1 }))).toBe(true)
  })
  it('false si exp está en el futuro', () => {
    expect(isExpired(makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 }))).toBe(false)
  })
  it('true (fail-closed) si no hay exp o el token es inválido', () => {
    expect(isExpired(makeToken({}))).toBe(true)
    expect(isExpired('basura')).toBe(true)
  })
})

describe('getClaims', () => {
  it('expone claims relevantes', () => {
    const t = makeToken({ token_version: 3, EmisorId: '5' })
    expect(getClaims(t)).toMatchObject({ token_version: 3, EmisorId: '5' })
  })
})
