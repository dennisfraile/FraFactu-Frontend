import { Button, Card, Badge, Input, FormField, Spinner, Tabs, EmptyState } from '@/design-system'
import { useState } from 'react'
import { ThemeToggle } from '@/app/ThemeToggle'

export function UiKitPage() {
  const [tab, setTab] = useState('a')
  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Catálogo · Tinta y Sello</h1>
        <ThemeToggle />
      </div>
      <Card className="mb-4">
        <h2 className="mb-3 font-display font-bold">Botones</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="subtle">Sutil</Button>
          <Button loading>Cargando</Button>
        </div>
      </Card>
      <Card className="mb-4">
        <h2 className="mb-3 font-display font-bold">Estados fiscales</h2>
        <div className="flex flex-wrap gap-2">
          <Badge estado="recibido">Recibido MH</Badge>
          <Badge estado="pendiente">Contingencia</Badge>
          <Badge estado="rechazado">Rechazado</Badge>
          <Badge estado="borrador">Borrador</Badge>
        </div>
      </Card>
      <Card className="mb-4">
        <FormField label="Correo" htmlFor="demo" hint="Ejemplo de campo"><Input id="demo" /></FormField>
      </Card>
      <Card className="mb-4">
        <Tabs tabs={[{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }]} active={tab} onChange={setTab} />
        <div className="pt-3 text-sm text-slate">Pestaña activa: {tab}</div>
      </Card>
      <Card><Spinner /> <EmptyState title="Sin datos" hint="Aún no hay registros" /></Card>
    </div>
  )
}
