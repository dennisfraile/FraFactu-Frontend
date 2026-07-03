import { QueryClient } from '@tanstack/react-query'

// staleTime compartido para catálogos/datos estáticos durante la sesión (1 hora),
// en vez de redeclarar la misma constante en cada feature.
export const HORA = 1000 * 60 * 60

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
