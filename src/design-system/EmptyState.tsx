export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-slate">{hint}</p>}
    </div>
  )
}
