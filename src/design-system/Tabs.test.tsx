import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from './Tabs'

describe('Tabs', () => {
  it('marca el activo y emite onChange al clicar otro', async () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[{ id: 'a', label: 'Uno' }, { id: 'b', label: 'Dos' }]} active="a" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: 'Dos' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
