import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Server,
  Package,
  Radio,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  ChevronDown,
  ChevronRight,
  Wallet,
  Ticket,
  Cpu,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type NavItemSingle = { to: string; icon: typeof LayoutDashboard; label: string; children?: never }
type NavItemGroup = { label: string; icon: typeof Users; children: { to: string; label: string }[]; to?: never }
type NavItem = NavItemSingle | NavItemGroup

function isGroup(item: NavItem): item is NavItemGroup {
  return 'children' in item && Array.isArray(item.children)
}

// Susunan menu mengikuti referensi MixRadius / RADIUS Manager
const nav: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  {
    label: 'Session User',
    icon: Radio,
    children: [
      { to: '/online', label: 'User Online' },
      { to: '/sessions/history', label: 'Riwayat Session' },
    ],
  },
  {
    label: 'Pelanggan',
    icon: Users,
    children: [
      { to: '/users', label: 'List Pelanggan' },
      { to: '/users/groups', label: 'Grup Pelanggan' },
    ],
  },
  {
    label: 'Router',
    icon: Server,
    children: [
      { to: '/nas', label: 'List Router' },
      { to: '/nas/access-points', label: 'Access Point' },
      { to: '/nas/ip-pools', label: 'IP Pool' },
    ],
  },
  {
    label: 'Profil Paket',
    icon: Package,
    children: [
      { to: '/services', label: 'List Profil Paket' },
    ],
  },
  {
    label: 'Voucher',
    icon: Ticket,
    children: [
      { to: '/accounting/vouchers', label: 'Kartu Voucher' },
    ],
  },
  {
    label: 'Tagihan & Pembayaran',
    icon: Wallet,
    children: [
      { to: '/accounting/unpaid-invoices', label: 'Tagihan Belum Lunas' },
      { to: '/accounting/invoices', label: 'Semua Tagihan' },
      { to: '/accounting/payments', label: 'Pembayaran' },
      { to: '/accounting/online-payment', label: 'Pembayaran Online' },
    ],
  },
  {
    label: 'Laporan',
    icon: BarChart3,
    children: [
      { to: '/reports/financial', label: 'Data Keuangan' },
      { to: '/reports/payments', label: 'Laporan Pembayaran' },
      { to: '/reports/traffic', label: 'Laporan Traffic' },
    ],
  },
  {
    label: 'Pengaturan',
    icon: Settings,
    children: [
      { to: '/settings', label: 'Pengaturan Aplikasi' },
      { to: '/managers', label: 'Manajer' },
    ],
  },
]

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupOpen = (item: NavItemGroup) => {
    if (openGroups[item.label] !== undefined) return openGroups[item.label]
    return item.children.some((c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'))
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <Wifi size={24} />
          <span>RadiusOne</span>
        </Link>
        <nav className="sidebar-nav">
          {nav.map((item) => {
            if (isGroup(item)) {
              const open = isGroupOpen(item)
              return (
                <div key={item.label} className="nav-group">
                  <button
                    type="button"
                    className={`nav-group-btn ${open ? 'open' : ''}`}
                    onClick={() => toggleGroup(item.label)}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {open && (
                    <div className="nav-sub">
                      {item.children.map((c) => (
                        <NavLink key={c.to} to={c.to} className={({ isActive }) => `nav-item sub ${isActive ? 'active' : ''}`}>
                          <span>{c.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{user?.email ?? user?.user_metadata?.username ?? 'Admin'}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="main-header">
          <Link to="/nas" className="btn-mikrotik-api" title="Router [NAS] dan koneksi MikroTik">
            <Cpu size={18} />
            <span>MikroTik API</span>
          </Link>
        </header>
        <div className="main-content">
          <Outlet />
        </div>
      </main>
      <style>{`
        .app-layout { display: flex; min-height: 100vh; }
        .sidebar { width: 260px; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
        .sidebar-brand { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem; font-weight: 700; font-size: 1.1rem; color: var(--text); }
        .sidebar-brand:hover { color: var(--accent); }
        .sidebar-nav { flex: 1; padding: 0.5rem; overflow-y: auto; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius); color: var(--text-muted); margin-bottom: 0.25rem; }
        .nav-item.sub { padding-left: 2rem; padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .nav-item:hover { background: var(--bg-card); color: var(--text); }
        .nav-item.active { background: rgba(56, 189, 248, 0.15); color: var(--accent); }
        .nav-group { margin-bottom: 0.25rem; }
        .nav-group-btn { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1rem; border: none; border-radius: var(--radius); background: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; text-align: left; }
        .nav-group-btn:hover { background: var(--bg-card); color: var(--text); }
        .nav-group-btn.open { color: var(--text); }
        .nav-group-btn svg:last-child { margin-left: auto; }
        .nav-sub { margin-top: 0.15rem; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid var(--border); }
        .user-info { margin-bottom: 0.5rem; }
        .user-email { font-size: 0.8rem; color: var(--text-muted); word-break: break-all; }
        .main { flex: 1; display: flex; flex-direction: column; overflow-x: auto; }
        .main-header { flex-shrink: 0; padding: 0.5rem 1.5rem 0; display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; }
        .btn-mikrotik-api { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: var(--radius); background: #2e7d32; color: #fff; font-size: 0.9rem; font-weight: 500; text-decoration: none; }
        .btn-mikrotik-api:hover { background: #1b5e20; color: #fff; }
        .main-content { flex: 1; padding: 1rem 1.5rem 1.5rem; }
        @media (max-width: 768px) {
          .sidebar { width: 72px; }
          .sidebar-brand span, .nav-item span, .nav-group-btn span, .nav-sub, .user-email, .sidebar-footer .btn span { display: none !important; }
          .sidebar-brand { justify-content: center; }
          .nav-item, .nav-group-btn { justify-content: center; }
        }
      `}</style>
    </div>
  )
}
