function App() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-ink px-6 text-paper">
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-md bg-sello/15 px-3 py-1 font-mono text-xs uppercase tracking-wider text-sello-bright ring-1 ring-sello/40">
          Fase 0 · Fundaciones
        </span>
        <h1 className="font-display text-6xl font-bold tracking-tight">FraFactu</h1>
        <p className="text-pretty text-paper/70">
          Facturación electrónica e inventario, unificados. Entorno de desarrollo
          en marcha — el diseño y los módulos llegan en las siguientes fases.
        </p>
        <p className="font-mono text-xs text-slate">backend :8080 · web :5173 · postgres :5432</p>
      </div>
    </main>
  )
}

export default App
