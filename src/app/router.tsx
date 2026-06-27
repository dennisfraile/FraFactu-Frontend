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
import { ComprasListPage } from '@/features/compras/pages/ComprasListPage'
import { CompraFormPage } from '@/features/compras/pages/CompraFormPage'
import { CompraDetallePage } from '@/features/compras/pages/CompraDetallePage'
import { DtesRecibidosListPage } from '@/features/dtes-recibidos/pages/DtesRecibidosListPage'
import { DteRecibidoDetallePage } from '@/features/dtes-recibidos/pages/DteRecibidoDetallePage'
import { MapearDtePage } from '@/features/dtes-recibidos/pages/MapearDtePage'
import { ConfiguracionCorreoPage } from '@/features/dtes-recibidos/pages/ConfiguracionCorreoPage'
import { GmailCallbackPage } from '@/features/dtes-recibidos/pages/GmailCallbackPage'

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
          <Route path="/compras" element={<ComprasListPage />} />
          <Route path="/compras/nueva" element={<CompraFormPage />} />
          <Route path="/compras/:id" element={<CompraDetallePage />} />
          <Route path="/compras/:id/editar" element={<CompraFormPage />} />
          <Route path="/dtes-recibidos" element={<DtesRecibidosListPage />} />
          <Route path="/dtes-recibidos/configuracion" element={<ConfiguracionCorreoPage />} />
          <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
          <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
          <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
