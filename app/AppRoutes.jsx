/**
 * Render halaman berdasarkan pathname secara eksplisit.
 * Dipakai supaya submenu (users-session/hotspot, vouchers/generate, dll) pasti tampil halaman yang benar.
 */
import { useLocation } from 'react-router-dom';
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

const routeMap = [
  { path: '/dashboard', component: Dashboard },
  { path: '/users-session/hotspot', component: UsersSession },
  { path: '/users-session/ppp', component: UsersSession },
  { path: '/users-session', component: UsersSession },
  { path: '/routers', component: Routers },
  { path: '/odp-pop/add', component: OdpPopForm },
  { path: '/odp-pop/map', component: OdpPopMap },
  { path: '/odp-pop', component: OdpPop },
  { path: '/neighbor-list', component: NeighborList },
  { path: '/packages', component: Packages },
  { path: '/customers', component: Customers },
  { path: '/bills', component: Bills },
  { path: '/reports/payout', component: Reports },
  { path: '/reports/net-profit', component: Reports },
  { path: '/reports/statistics', component: Reports },
  { path: '/reports', component: Reports },
  { path: '/online-payment', component: OnlinePayment },
  { path: '/support-tickets', component: SupportTickets },
  { path: '/system-tools', component: SystemTools },
  { path: '/software-logs/radius-auth', component: SoftwareLogs },
  { path: '/software-logs', component: SoftwareLogs },
  { path: '/vouchers/generate', component: Vouchers },
  { path: '/vouchers', component: Vouchers },
  { path: '/vpn-radius', component: VpnRadius },
  { path: '/app-settings/general', component: AppSettings },
  { path: '/app-settings/radius', component: AppSettings },
  { path: '/app-settings/localisation', component: AppSettings },
  { path: '/app-settings/invoice-logo', component: AppSettings },
  { path: '/app-settings', component: AppSettings },
  { path: '/licence-info', component: LicenceInfo },
];

// Path yang lebih panjang didahulukan (match eksak dulu)
const sortedRoutes = [...routeMap].sort((a, b) => b.path.length - a.path.length);

export default function AppRoutes() {
  const location = useLocation();
  const pathname = location.pathname || '/';

  // OdpPopForm edit: /odp-pop/edit/123
  if (pathname.startsWith('/odp-pop/edit/')) {
    return <OdpPopForm />;
  }

  const match = sortedRoutes.find((r) => pathname === r.path);
  const RouteComponent = match ? match.component : Dashboard;

  return <RouteComponent />;
}
