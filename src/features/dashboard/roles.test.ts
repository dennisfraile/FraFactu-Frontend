import { describe, it, expect } from 'vitest'
import { DASHBOARD_GERENCIAL, DASHBOARD_CAJERO } from './roles'

describe('curación de roles del dashboard', () => {
  it('gerencial cubre admin/gerente/contador/auditor/superadmin, sin Cajero', () => {
    expect(DASHBOARD_GERENCIAL).toEqual(['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor'])
    expect(DASHBOARD_GERENCIAL).not.toContain('Cajero')
  })
  it('la sección de cajero es solo para Cajero', () => {
    expect(DASHBOARD_CAJERO).toEqual(['Cajero'])
  })
})
