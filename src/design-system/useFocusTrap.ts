import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

// Atrapa el foco dentro de un contenedor mientras `active` sea true: enfoca el
// primer elemento al abrir, cicla con Tab/Shift+Tab sin salir del diálogo, y al
// cerrar devuelve el foco a donde estaba. Se comparte entre Modal y Drawer.
// El contenedor debe ser enfocable (tabIndex={-1}) para el caso sin focusables.
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return
    const prevFocused = document.activeElement as HTMLElement | null

    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))

    // Foco inicial en el primer elemento interactivo, o en el contenedor.
    ;(focusables()[0] ?? node).focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) { e.preventDefault(); node!.focus(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey && (activeEl === first || activeEl === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      prevFocused?.focus?.()
    }
  }, [active])
  return ref
}
