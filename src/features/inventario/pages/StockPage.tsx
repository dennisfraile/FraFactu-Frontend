import { useState } from 'react'
import { Tabs } from '@/design-system'
import { ExistenciasTab } from '../components/ExistenciasTab'
import { MovimientosTab } from '../components/MovimientosTab'

const TABS = [{ id: 'existencias', label: 'Existencias' }, { id: 'movimientos', label: 'Movimientos' }]

export function StockPage() {
  const [tab, setTab] = useState('existencias')
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Stock</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'existencias' && <ExistenciasTab />}
      {tab === 'movimientos' && <MovimientosTab />}
    </div>
  )
}
