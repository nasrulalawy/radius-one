import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserGroups from './pages/UserGroups'
import Nas from './pages/Nas'
import AccessPoints from './pages/AccessPoints'
import IpPools from './pages/IpPools'
import Managers from './pages/Managers'
import Services from './pages/Services'
import Online from './pages/Online'
import SessionHistory from './pages/SessionHistory'
import Payments from './pages/Payments'
import Vouchers from './pages/Vouchers'
import Invoices from './pages/Invoices'
import UnpaidInvoices from './pages/UnpaidInvoices'
import OnlinePayment from './pages/OnlinePayment'
import PaymentReport from './pages/PaymentReport'
import TrafficReport from './pages/TrafficReport'
import FinancialReport from './pages/FinancialReport'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: { pathname: location.pathname } }} replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/groups" element={<UserGroups />} />
        <Route path="nas" element={<Nas />} />
        <Route path="nas/access-points" element={<AccessPoints />} />
        <Route path="nas/ip-pools" element={<IpPools />} />
        <Route path="managers" element={<Managers />} />
        <Route path="services" element={<Services />} />
        <Route path="online" element={<Online />} />
        <Route path="sessions/history" element={<SessionHistory />} />
        <Route path="accounting/payments" element={<Payments />} />
        <Route path="accounting/vouchers" element={<Vouchers />} />
        <Route path="accounting/invoices" element={<Invoices />} />
        <Route path="accounting/unpaid-invoices" element={<UnpaidInvoices />} />
        <Route path="accounting/online-payment" element={<OnlinePayment />} />
        <Route path="reports" element={<PaymentReport />} />
        <Route path="reports/payments" element={<PaymentReport />} />
        <Route path="reports/traffic" element={<TrafficReport />} />
        <Route path="reports/financial" element={<FinancialReport />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
