import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/globals.css'
import App from './App.tsx'
import { queryClient } from '@/lib/query/queryClient'
import { ToastProvider } from '@/design-system'
import { useAuthStore } from '@/app/auth-store'
import { useThemeStore } from '@/app/theme-store'
import { env } from '@/lib/config/env'

useThemeStore.getState().init()
useAuthStore.getState().hydrate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
