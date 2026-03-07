import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { apiMe, apiLogout } from './api';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Bills from './pages/Bills';
import Packages from './pages/Packages';
import Routers from './pages/Routers';
import UsersSession from './pages/UsersSession';
import AppSettings from './pages/AppSettings';
import OdpPop from './pages/OdpPop';
import OdpPopForm from './pages/OdpPopForm';
import OdpPopMap from './pages/OdpPopMap';
import SupportTickets from './pages/SupportTickets';
import Reports from './pages/Reports';
import SystemTools from './pages/SystemTools';
import SoftwareLogs from './pages/SoftwareLogs';
import Vouchers from './pages/Vouchers';
import VpnRadius from './pages/VpnRadius';
import NeighborList from './pages/NeighborList';
import OnlinePayment from './pages/OnlinePayment';
import LicenceInfo from './pages/LicenceInfo';

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">Memuat...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
      <Route path="/" element={<PrivateRoute user={user}><Layout user={user} onLogout={handleLogout} /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users-session" element={<UsersSession />} />
        <Route path="routers" element={<Routers />} />
        <Route path="odp-pop" element={<OdpPop />} />
        <Route path="odp-pop/add" element={<OdpPopForm />} />
        <Route path="odp-pop/edit/:id" element={<OdpPopForm />} />
        <Route path="odp-pop/map" element={<OdpPopMap />} />
        <Route path="neighbor-list" element={<NeighborList />} />
        <Route path="packages" element={<Packages />} />
        <Route path="customers" element={<Customers />} />
        <Route path="bills" element={<Bills />} />
        <Route path="reports" element={<Reports />} />
        <Route path="online-payment" element={<OnlinePayment />} />
        <Route path="support-tickets" element={<SupportTickets />} />
        <Route path="system-tools" element={<SystemTools />} />
        <Route path="software-logs" element={<SoftwareLogs />} />
        <Route path="vouchers" element={<Vouchers />} />
        <Route path="vpn-radius" element={<VpnRadius />} />
        <Route path="app-settings" element={<AppSettings />} />
        <Route path="licence-info" element={<LicenceInfo />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
