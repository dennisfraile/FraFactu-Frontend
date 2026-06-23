// src/design-system/Table.tsx
import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode }

interface ServerPagination {
  page: number // 1-based
  totalPages: number
  onPageChange: (page: number) => void
}

interface TableProps<T> {
  columns: Column<T>[]
  rows: T[]
  pageSize?: number
  getRowKey: (row: T) => string | number
  serverPagination?: ServerPagination
}

export function Table<T>({ columns, rows, pageSize = 10, getRowKey, serverPagination }: TableProps<T>) {
  const [page, setPage] = useState(0) // 0-based, solo modo cliente
  const esServidor = !!serverPagination

  const pagesCliente = Math.max(1, Math.ceil(rows.length / pageSize))
  const slice = esServidor ? rows : rows.slice(page * pageSize, page * pageSize + pageSize)

  const pageLabelActual = esServidor ? serverPagination!.page : page + 1
  const pageLabelTotal = esServidor ? serverPagination!.totalPages : pagesCliente
  const enPrimera = esServidor ? serverPagination!.page <= 1 : page === 0
  const enUltima = esServidor ? serverPagination!.page >= serverPagination!.totalPages : page >= pagesCliente - 1

  const irAtras = () => (esServidor ? serverPagination!.onPageChange(serverPagination!.page - 1) : setPage((p) => p - 1))
  const irAdelante = () => (esServidor ? serverPagination!.onPageChange(serverPagination!.page + 1) : setPage((p) => p + 1))

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
        <span>Página {pageLabelActual} de {pageLabelTotal}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={enPrimera} onClick={irAtras}>Anterior</Button>
          <Button variant="ghost" size="sm" disabled={enUltima} onClick={irAdelante}>Siguiente</Button>
        </div>
      </div>
    </div>
  )
}
