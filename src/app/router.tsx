import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { FirstLoginPage } from '@/features/auth/FirstLoginPage'
import { DashboardPlaceholder } from '@/features/dashboard/DashboardPlaceholder'
import { UiKitPage } from '@/features/ui-kit/UiKitPage'
import { EmitirDtePage } from '@/features/facturacion/pages/EmitirDtePage'
import { EmitirLandingPage } from '@/features/facturacion/pages/EmitirLandingPage'
import { HistorialPage } from '@/features/facturacion/pages/HistorialPage'
import { DteDetallePage } from '@/features/facturacion/pages/DteDetallePage'
import { ProveedoresPage } from '@/features/compras/pages/ProveedoresPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/first-login" element={<FirstLoginPage />} />
      <Route path="/ui-kit" element={<UiKitPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/facturacion/emitir" element={<EmitirLandingPage />} />
          <Route path="/facturacion/emitir/:tipo" element={<EmitirDtePage />} />
          <Route path="/facturacion/historial" element={<HistorialPage />} />
          <Route path="/facturacion/:id" element={<DteDetallePage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
