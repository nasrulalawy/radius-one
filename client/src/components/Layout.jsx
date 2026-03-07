import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const navGroups = [
  { title: 'Monitoring', items: [{ to: '/dashboard', icon: '📊', label: 'Dashboard' }, { to: '/users-session', icon: '🟢', label: 'Users Session' }] },
  { title: 'Router & Jaringan', items: [{ to: '/routers', icon: '📡', label: 'Router (NAS)' }, { to: '/odp-pop', icon: '📍', label: 'ODP | POP' }, { to: '/neighbor-list', icon: '📶', label: 'Neighbor List' }] },
  { title: 'Service Plan', items: [{ to: '/packages', icon: '📶', label: 'Paket' }] },
  { title: 'Pelanggan', items: [{ to: '/customers', icon: '👥', label: 'Pelanggan' }, { to: '/vouchers', icon: '🎫', label: 'Voucher' }, { to: '/vpn-radius', icon: '🔐', label: 'VPN Radius' }] },
  { title: 'Keuangan', items: [{ to: '/bills', icon: '📄', label: 'Tagihan' }, { to: '/bills?unpaid=1', label: 'Unpaid Invoice' }, { to: '/reports', icon: '📈', label: 'Laporan' }, { to: '/online-payment', icon: '💳', label: 'Online Payment' }] },
  { title: 'Support & Tools', items: [{ to: '/support-tickets', icon: '🎧', label: 'Support Tickets' }, { to: '/system-tools', icon: '🧰', label: 'System Tools' }, { to: '/software-logs', icon: '📝', label: 'Software Logs' }] },
  { title: 'Pengaturan', items: [{ to: '/app-settings', icon: '⚙️', label: 'App Settings' }, { to: '/licence-info', icon: '📋', label: 'Licence Info' }] },
];

export default function Layout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
                    <NavLink
                      key={item.to + (item.label || '')}
                      to={item.to}
                      end={item.to === '/dashboard' || item.to === '/bills'}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                          isActive ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-100'
                        }`
                      }
                    >
                      {item.icon && <span className="text-base">{item.icon}</span>}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-200">
            <div className="text-sm text-slate-600 mb-2">{user?.username}</div>
            <a href="/client/login" target="_blank" rel="noreferrer" className="block text-sm text-sky-600 hover:underline mb-1">Portal Pelanggan</a>
            <button type="button" onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
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
