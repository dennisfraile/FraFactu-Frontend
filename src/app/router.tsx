import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from './AppLayout'
import { RoleRoute } from './RoleRoute'
// Páginas de auth: eager (son la puerta de entrada, cargarlas diferidas sólo
// mostraría un spinner antes del login). Todo lo que vive tras ProtectedRoute se
// carga con lazy() para partir el bundle por feature; el Suspense compartido está
// en AppLayout, alrededor del <Outlet/>.
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { FirstLoginPage } from '@/features/auth/FirstLoginPage'
import { UiKitPage } from '@/features/ui-kit/UiKitPage'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const EmitirDtePage = lazy(() => import('@/features/facturacion/pages/EmitirDtePage').then((m) => ({ default: m.EmitirDtePage })))
const EmitirLandingPage = lazy(() => import('@/features/facturacion/pages/EmitirLandingPage').then((m) => ({ default: m.EmitirLandingPage })))
const HistorialPage = lazy(() => import('@/features/facturacion/pages/HistorialPage').then((m) => ({ default: m.HistorialPage })))
const DteDetallePage = lazy(() => import('@/features/facturacion/pages/DteDetallePage').then((m) => ({ default: m.DteDetallePage })))
const ProveedoresPage = lazy(() => import('@/features/compras/pages/ProveedoresPage').then((m) => ({ default: m.ProveedoresPage })))
const ComprasListPage = lazy(() => import('@/features/compras/pages/ComprasListPage').then((m) => ({ default: m.ComprasListPage })))
const CompraFormPage = lazy(() => import('@/features/compras/pages/CompraFormPage').then((m) => ({ default: m.CompraFormPage })))
const CompraDetallePage = lazy(() => import('@/features/compras/pages/CompraDetallePage').then((m) => ({ default: m.CompraDetallePage })))
const DtesRecibidosListPage = lazy(() => import('@/features/dtes-recibidos/pages/DtesRecibidosListPage').then((m) => ({ default: m.DtesRecibidosListPage })))
const DteRecibidoDetallePage = lazy(() => import('@/features/dtes-recibidos/pages/DteRecibidoDetallePage').then((m) => ({ default: m.DteRecibidoDetallePage })))
const MapearDtePage = lazy(() => import('@/features/dtes-recibidos/pages/MapearDtePage').then((m) => ({ default: m.MapearDtePage })))
const ConfiguracionCorreoPage = lazy(() => import('@/features/dtes-recibidos/pages/ConfiguracionCorreoPage').then((m) => ({ default: m.ConfiguracionCorreoPage })))
const GmailCallbackPage = lazy(() => import('@/features/dtes-recibidos/pages/GmailCallbackPage').then((m) => ({ default: m.GmailCallbackPage })))
const PlanesListPage = lazy(() => import('@/features/cuentas-por-cobrar/pages/PlanesListPage').then((m) => ({ default: m.PlanesListPage })))
const PlanDetallePage = lazy(() => import('@/features/cuentas-por-cobrar/pages/PlanDetallePage').then((m) => ({ default: m.PlanDetallePage })))
const CrearVentaCreditoPage = lazy(() => import('@/features/cuentas-por-cobrar/pages/CrearVentaCreditoPage').then((m) => ({ default: m.CrearVentaCreditoPage })))
const ConfiguracionMoraPage = lazy(() => import('@/features/cuentas-por-cobrar/pages/ConfiguracionMoraPage').then((m) => ({ default: m.ConfiguracionMoraPage })))
const ProductosPage = lazy(() => import('@/features/inventario/pages/ProductosPage').then((m) => ({ default: m.ProductosPage })))
const ProductoFormPage = lazy(() => import('@/features/inventario/pages/ProductoFormPage').then((m) => ({ default: m.ProductoFormPage })))
const StockPage = lazy(() => import('@/features/inventario/pages/StockPage').then((m) => ({ default: m.StockPage })))
const ReportesInventarioPage = lazy(() => import('@/features/inventario/pages/ReportesInventarioPage').then((m) => ({ default: m.ReportesInventarioPage })))
const UsuariosPage = lazy(() => import('@/features/usuarios/pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))

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
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero']} />}>
            <Route path="/facturacion/emitir" element={<EmitirLandingPage />} />
            <Route path="/facturacion/emitir/:tipo" element={<EmitirDtePage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor']} />}>
            <Route path="/facturacion/historial" element={<HistorialPage />} />
            <Route path="/facturacion/:id" element={<DteDetallePage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador']} />}>
            <Route path="/compras" element={<ComprasListPage />} />
            <Route path="/compras/nueva" element={<CompraFormPage />} />
            <Route path="/compras/:id" element={<CompraDetallePage />} />
            <Route path="/compras/:id/editar" element={<CompraFormPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']} />}>
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/dtes-recibidos" element={<DtesRecibidosListPage />} />
            <Route path="/dtes-recibidos/configuracion" element={<ConfiguracionCorreoPage />} />
            <Route path="/dtes-recibidos/gmail/callback" element={<GmailCallbackPage />} />
            <Route path="/dtes-recibidos/:id" element={<DteRecibidoDetallePage />} />
            <Route path="/dtes-recibidos/:id/mapear" element={<MapearDtePage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero']} />}>
            <Route path="/cuentas-por-cobrar" element={<PlanesListPage />} />
            <Route path="/cuentas-por-cobrar/nueva" element={<CrearVentaCreditoPage />} />
            <Route path="/cuentas-por-cobrar/:planId" element={<PlanDetallePage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal']} />}>
            <Route path="/cuentas-por-cobrar/configuracion-mora" element={<ConfiguracionMoraPage />} />
          </Route>

          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Cajero', 'Contador', 'Auditor']} />}>
            <Route path="/inventario/productos" element={<ProductosPage />} />
            <Route path="/inventario/stock" element={<StockPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal']} />}>
            <Route path="/inventario/productos/nuevo" element={<ProductoFormPage />} />
            <Route path="/inventario/productos/:id/editar" element={<ProductoFormPage />} />
          </Route>
          <Route element={<RoleRoute allow={['EmisorAdmin', 'GerenteSucursal', 'Contador', 'Auditor']} />}>
            <Route path="/inventario/reportes" element={<ReportesInventarioPage />} />
          </Route>

          <Route element={<RoleRoute allow={['SuperAdmin', 'EmisorAdmin', 'GerenteSucursal', 'Auditor']} />}>
            <Route path="/config/usuarios" element={<UsuariosPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
