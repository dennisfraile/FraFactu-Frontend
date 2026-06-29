import { Button, Icon } from '@/design-system'
import type { FormatoReporte } from '../api'

export function ReporteDescargaButtons({ label, onDescargar }: { label: string; onDescargar: (f: FormatoReporte) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate">{label}</span>
      <Button variant="ghost" onClick={() => onDescargar('pdf')}><Icon name="printer" size={16} />PDF</Button>
      <Button variant="ghost" onClick={() => onDescargar('excel')}><Icon name="printer" size={16} />Excel</Button>
    </div>
  )
}
