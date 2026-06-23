import { Card } from '@/design-system'
export function DashboardPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
      <Card><p className="text-slate">Los KPIs de facturación e inventario llegan en fases siguientes (F5–F7).</p></Card>
    </div>
  )
}
