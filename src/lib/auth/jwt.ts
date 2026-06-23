export interface JwtClaims {
  exp?: number
  pwd_change_required?: boolean | string
  token_version?: number
  EmisorId?: string
  [k: string]: unknown
}

function base64UrlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad
  return atob(b64)
}

export function decodeJwt(token: string): JwtClaims | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtClaims
  } catch {
    return null
  }
}

export const getClaims = decodeJwt

export function isExpired(token: string, skewSeconds = 0): boolean {
  const claims = decodeJwt(token)
  if (!claims || typeof claims.exp !== 'number') return true // fail-closed
  const now = Math.floor(Date.now() / 1000)
  return claims.exp <= now + skewSeconds
}
