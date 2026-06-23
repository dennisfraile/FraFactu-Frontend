import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode }
interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  getRowKey: (row: T) => string | number
}
export function Table<T>({ columns, rows, pageSize = 10, getRowKey }: TableProps<T>) {
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize)
  return (
    <div className="flex flex-col gap-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-slate">
            {columns.map((c) => <th key={c.key} className="py-2 font-medium">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {slice.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-hairline">
              {columns.map((c) => (
                <td key={c.key} className="py-2">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between text-sm text-slate">
        <span>Página {page + 1} de {pages}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <Button variant="ghost" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      </div>
    </div>
  )
}
