interface Tab { id: string; label: string }
export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-hairline">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${active === t.id ? 'border-sello font-semibold text-sello' : 'border-transparent text-slate hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
