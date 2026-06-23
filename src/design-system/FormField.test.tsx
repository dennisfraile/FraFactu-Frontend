import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from './FormField'
import { Input } from './Input'

describe('FormField', () => {
  it('asocia label e input por id y muestra el error con role alert', () => {
    render(
      <FormField label="Correo" htmlFor="email" error="Requerido">
        <Input id="email" />
      </FormField>,
    )
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Requerido')
  })
})
