import { Suspense, useState, type FocusEvent } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '@/design-system'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const CAMPOS_FORM = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()

  // Al empezar a interactuar con un formulario, colapsa el menú a iconos para dar aire.
  function onMainFocus(e: FocusEvent<HTMLElement>) {
    if (!collapsed && CAMPOS_FORM.has(e.target.tagName)) setCollapsed(true)
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <main onFocusCapture={onMainFocus} className="flex-1 overflow-auto bg-canvas p-6 dark:bg-canvas-dark">
          <div key={pathname} className="animate-page">
            <Suspense fallback={<div className="flex justify-center p-10"><Spinner /></div>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
