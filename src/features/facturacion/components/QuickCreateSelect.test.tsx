import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuickCreateSelect } from './QuickCreateSelect'

describe('QuickCreateSelect', () => {
  it('abre el modal de creación y al crear selecciona la entidad', async () => {
    let seleccionado: { id: number; nombre: string } | null = null
    render(
      <QuickCreateSelect<{ id: number; nombre: string }>
        onSearch={async () => []}
        getLabel={(x) => x.nombre}
        onSelect={(x) => { seleccionado = x }}
        crearLabel="Crear nuevo receptor"
        renderCreateModal={({ onCreated, onClose }) => (
          <div>
            <button onClick={() => onCreated({ id: 99, nombre: 'Nuevo' })}>Guardar</button>
            <button onClick={onClose}>Cerrar</button>
          </div>
        )}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /crear nuevo receptor/i }))
    await userEvent.click(screen.getByRole('button', { name: /guardar/i }))
    expect(seleccionado).toEqual({ id: 99, nombre: 'Nuevo' })
  })
})
