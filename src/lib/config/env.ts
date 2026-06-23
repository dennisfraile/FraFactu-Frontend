const apiUrl = import.meta.env.VITE_API_URL as string | undefined
if (!apiUrl) {
  // Falla ruidosamente: sin API no hay app.
  throw new Error('VITE_API_URL no está definida. Copia .env.example a .env.')
}

export const env = {
  apiUrl,
  googleClientId: (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '',
}
