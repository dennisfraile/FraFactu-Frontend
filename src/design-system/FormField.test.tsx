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

  it('con error marca aria-invalid y describe el input con el id del mensaje', () => {
    render(
      <FormField label="Correo" htmlFor="email" error="Requerido">
        <Input id="email" />
      </FormField>,
    )
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(screen.getByRole('alert')).toHaveAttribute('id', describedBy!)
  })

  it('sin error no marca aria-invalid y describe con el hint si lo hay', () => {
    render(
      <FormField label="Correo" htmlFor="email" hint="Usa tu correo laboral">
        <Input id="email" />
      </FormField>,
    )
    const input = screen.getByLabelText('Correo')
    expect(input).not.toHaveAttribute('aria-invalid')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(screen.getByText('Usa tu correo laboral')).toHaveAttribute('id', describedBy!)
  })
})
