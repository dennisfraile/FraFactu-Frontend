export function Spinner({ size = 16, label = 'Cargando' }: { size?: number; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  )
}
