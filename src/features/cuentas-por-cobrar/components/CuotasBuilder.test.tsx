import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { CuotasBuilder } from './CuotasBuilder'
import type { CuotaDraft, ModoCuota } from '../calc/cuotas'

function Harness({ total }: { total: number }) {
  const [drafts, setDrafts] = useState<CuotaDraft[]>([
    { fechaPactada: '2026-07-01', valor: 40 },
    { fechaPactada: '2026-08-01', valor: 50 },
  ])
  const [modo, setModo] = useState<ModoCuota>('monto')
  return <CuotasBuilder total={total} drafts={drafts} modo={modo} onDrafts={setDrafts} onModo={setModo} />
}

describe('CuotasBuilder', () => {
  it('muestra error cuando las cuotas no cuadran con el total', () => {
    render(<Harness total={100} />)
    expect(screen.getByText(/no coincide/i)).toBeInTheDocument()
  })
  it('permite agregar una cuota', () => {
    render(<Harness total={100} />)
    fireEvent.click(screen.getByRole('button', { name: /agregar cuota/i }))
    // ahora hay 3 filas de fecha
    expect(screen.getAllByLabelText(/fecha/i).length).toBe(3)
  })
  it('llama onDrafts al cambiar un valor', () => {
    const onDrafts = vi.fn()
    render(<CuotasBuilder total={100} modo="monto" onModo={() => {}} onDrafts={onDrafts}
      drafts={[{ fechaPactada: '2026-07-01', valor: 40 }, { fechaPactada: '2026-08-01', valor: 60 }]} />)
    fireEvent.change(screen.getAllByLabelText(/monto|valor/i)[0], { target: { value: '30' } })
    expect(onDrafts).toHaveBeenCalled()
  })
})
