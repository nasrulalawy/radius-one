import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

// Semua path punya route di App.jsx; submenu mengarah ke halaman/tab yang benar.
const navGroups = [
  { title: 'Monitoring', items: [{ to: '/dashboard', icon: '📊', label: 'Dashboard' }, { to: '/users-session', icon: '🟢', label: 'Users Session', children: [{ to: '/users-session/hotspot', label: 'Hotspot' }, { to: '/users-session/ppp', label: 'PPP' }] }] },
  { title: 'Router & Jaringan', items: [{ to: '/routers', icon: '📡', label: 'Router (NAS)' }, { to: '/odp-pop', icon: '📍', label: 'ODP | POP', children: [{ to: '/odp-pop', label: 'Daftar ODP' }, { to: '/odp-pop/map', label: 'View Map' }] }, { to: '/neighbor-list', icon: '📶', label: 'Neighbor List' }] },
  { title: 'Service Plan', items: [{ to: '/packages', icon: '📶', label: 'Paket' }] },
  { title: 'Pelanggan', items: [{ to: '/customers', icon: '👥', label: 'Pelanggan', children: [{ to: '/customers?type=hotspot', label: 'Hotspot Users' }, { to: '/customers?type=pppoe', label: 'PPP Users' }] }, { to: '/vouchers', icon: '🎫', label: 'Voucher', children: [{ to: '/vouchers/generate', label: 'Hotspot Voucher' }] }, { to: '/vpn-radius', icon: '🔐', label: 'VPN Radius' }] },
  { title: 'Keuangan', items: [{ to: '/bills', icon: '📄', label: 'Tagihan', children: [{ to: '/bills?unpaid=1', label: 'Unpaid Invoice' }] }, { to: '/reports', icon: '📈', label: 'Laporan', children: [{ to: '/reports/payout', label: 'Payout' }, { to: '/reports/net-profit', label: 'Net Profit' }, { to: '/reports/statistics', label: 'Statistics' }] }, { to: '/online-payment', icon: '💳', label: 'Online Payment' }] },
  { title: 'Support & Tools', items: [{ to: '/support-tickets', icon: '🎧', label: 'Support Tickets', children: [{ to: '/support-tickets?status=open', label: 'Opened' }, { to: '/support-tickets?status=closed', label: 'Closed' }] }, { to: '/system-tools', icon: '🧰', label: 'System Tools' }, { to: '/software-logs', icon: '📝', label: 'Software Logs', children: [{ to: '/software-logs/radius-auth', label: 'Radius Auth Log' }] }] },
  { title: 'Pengaturan', items: [{ to: '/app-settings', icon: '⚙️', label: 'App Settings', children: [{ to: '/app-settings/general', label: 'General' }, { to: '/app-settings/radius', label: 'RADIUS' }, { to: '/app-settings/localisation', label: 'Localisation' }, { to: '/app-settings/invoice-logo', label: 'Invoice Logo' }] }, { to: '/licence-info', icon: '📋', label: 'Licence Info' }] },
];

/** Submenu pakai <a href> + stopPropagation agar klik tidak tertangkap parent dan browser benar-benar ke URL yang diklik. */
function SubmenuLinks({ item, location }) {
  return (
    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2" onClick={(e) => e.stopPropagation()}>
      {item.children.map((c) => {
        const pathOnly = c.to.split('?')[0];
        const search = c.to.includes('?') ? '?' + c.to.split('?')[1] : '';
        const isActive = location.pathname === pathOnly && (search ? location.search === search : true);
        return (
          <a
            key={c.to + (c.label || '')}
            href={c.to}
            onClick={(e) => e.stopPropagation()}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm no-underline ${isActive ? 'bg-sky-50 text-sky-600 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {c.label}
          </a>
        );
      })}
    </div>
  );
}

function NavItem({ item, isActive }) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const pathMatch = (path) => {
    if (path === item.to) return true;
    if (item.children) return item.children.some((c) => c.to === path || (c.to.startsWith('/') && location.pathname.startsWith(c.to.split('?')[0])));
    return false;
  };
  const isOpen = hasChildren && (isActive || (item.children && item.children.some((c) => location.pathname === c.to.split('?')[0] || location.search === (c.to.includes('?') ? '?' + c.to.split('?')[1] : ''))));
  const [open, setOpen] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setOpen(true);
  }, [isOpen]);

  if (!hasChildren) {
    return (
      <NavLink
        to={item.to}
        end={item.to === '/dashboard'}
        className={({ isActive: active }) =>
          `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-100'}`
        }
      >
        {item.icon && <span className="text-base">{item.icon}</span>}
        {item.label}
      </NavLink>
    );
  }

  return (
    <div className="mb-0.5">
      <div className={`flex items-center gap-1 rounded-lg ${isActive ? 'bg-slate-50' : ''}`}>
        <NavLink
          to={item.to}
          end
          className={({ isActive: active }) =>
            `flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${active || isActive ? 'text-sky-600' : 'text-slate-600'} hover:bg-slate-100`
          }
        >
          {item.icon && <span className="text-base">{item.icon}</span>}
          {item.label}
        </NavLink>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
          aria-expanded={open}
          aria-label={open ? 'Tutup submenu' : 'Buka submenu'}
        >
          <svg className={`w-4 h-4 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {open && (
        <SubmenuLinks item={item} location={location} />
      )}
    </div>
  );
}

export default function Layout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (item) => {
    if (location.pathname === item.to) return true;
    if (item.children) return item.children.some((c) => location.pathname === c.to.split('?')[0]);
    return false;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200">
            <NavLink to="/dashboard" className="text-lg font-bold text-slate-800 hover:text-sky-600">
              Radius One
            </NavLink>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-4">
            {navGroups.map((g) => (
              <div key={g.title}>
                <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {g.title}
                </div>
                <div className="mt-1 space-y-0.5">
                  {g.items.map((item) => (
                    <NavItem key={item.to + (item.label || '')} item={item} isActive={isActive(item)} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-200">
            <div className="text-sm text-slate-600 mb-2">{user?.username}</div>
            <a href="/client/login" target="_blank" rel="noreferrer" className="block text-sm text-sky-600 hover:underline mb-1">Portal Pelanggan</a>
            <button type="button" onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-slate-50 hover:bg-red-50">
              Logout
            </button>
          </div>
        </div>
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-20 flex items-center h-14 px-4 bg-white border-b border-slate-200">
          <button type="button" className="p-2 rounded-lg lg:hidden hover:bg-slate-100" onClick={() => setSidebarOpen(true)} aria-label="Menu">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
