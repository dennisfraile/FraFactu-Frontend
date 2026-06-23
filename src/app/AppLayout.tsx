import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-canvas p-6 dark:bg-[#0f1c18]"><Outlet /></main>
      </div>
    </div>
  )
}
