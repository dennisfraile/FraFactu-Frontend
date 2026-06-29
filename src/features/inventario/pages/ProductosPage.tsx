import { useState } from 'react'
import { Tabs } from '@/design-system'
import { ProductosTab } from '../components/ProductosTab'
import { CategoriasTab } from '../components/CategoriasTab'
import { MarcasTab } from '../components/MarcasTab'

const TABS = [{ id: 'productos', label: 'Productos' }, { id: 'categorias', label: 'Categorías' }, { id: 'marcas', label: 'Marcas' }]

export function ProductosPage() {
  const [tab, setTab] = useState('productos')
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-ink">Productos y servicios</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'productos' && <ProductosTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'marcas' && <MarcasTab />}
    </div>
  )
}
