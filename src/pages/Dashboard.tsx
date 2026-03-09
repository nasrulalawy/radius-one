import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Server, Package, Radio, Wallet, TrendingUp, Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

type PaymentRow = { amount: number; created_at: string }
type UserStatus = { status: string; count: number }
type TopUser = { username: string; data_used_mb: number }

const COLORS = ['#38bdf8', '#22c55e', '#a78bfa', '#f59e0b', '#ef4444', '#94a3b8']

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, nas: 0, services: 0, online: 0, totalRevenue: 0, activeUsers: 0 })
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; total: number; count: number }[]>([])
  const [userByStatus, setUserByStatus] = useState<UserStatus[]>([])
  const [topUsersByData, setTopUsersByData] = useState<TopUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const [u, n, s, o, payments, usersList] = await Promise.all([
        supabase.from('radius_users').select('id, status', { count: 'exact', head: true }),
        supabase.from('nas_devices').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }),
        supabase.from('sessions').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, created_at').order('created_at', { ascending: true }),
        supabase.from('radius_users').select('username, data_used_mb').order('data_used_mb', { ascending: false }).limit(10),
      ])

      const usersData = await supabase.from('radius_users').select('status')
      const statusCount: Record<string, number> = {}
      ;(usersData.data ?? []).forEach((r: { status: string }) => {
        statusCount[r.status] = (statusCount[r.status] || 0) + 1
      })
      setUserByStatus(Object.entries(statusCount).map(([status, count]) => ({ status, count })))

      const payList = (payments.data as PaymentRow[]) ?? []
      const totalRev = payList.reduce((a, r) => a + Number(r.amount), 0)
      const now = new Date()
      const last7: { date: string; total: number; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const dayPay = payList.filter((p) => p.created_at.startsWith(dateStr))
        const total = dayPay.reduce((a, p) => a + Number(p.amount), 0)
        last7.push({ date: dateStr.slice(5), total, count: dayPay.length })
      }
      setRevenueByDay(last7)
      setTopUsersByData((usersList.data as TopUser[]) ?? [])

      const activeCount = (usersData.data ?? []).filter((r: { status: string }) => r.status === 'active').length

      setStats({
        users: u.count ?? 0,
        nas: n.count ?? 0,
        services: s.count ?? 0,
        online: o.count ?? 0,
        totalRevenue: totalRev,
        activeUsers: activeCount,
      })
      setLoading(false)
    }
    run()
  }, [])

  const cards = [
    { title: 'Total Pelanggan', value: stats.users, icon: Users, color: '#38bdf8', sub: `${stats.activeUsers} aktif` },
    { title: 'Router', value: stats.nas, icon: Server, color: '#22c55e' },
    { title: 'Profil Paket', value: stats.services, icon: Package, color: '#a78bfa' },
    { title: 'User Online', value: stats.online, icon: Radio, color: '#f59e0b' },
    { title: 'Total Pendapatan', value: stats.totalRevenue.toFixed(2), icon: Wallet, color: '#10b981' },
  ]

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>

  return (
    <div className="dashboard-page">
      <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>Dashboard</h1>

      <div className="dashboard-grid">
        {cards.map(({ title, value, icon: Icon, color, sub }) => (
          <div key={title} className="card stat-card">
            <div className="stat-icon" style={{ background: `${color}20`, color }}>
              <Icon size={28} />
            </div>
            <div>
              <p className="stat-value">{value}</p>
              <p className="stat-label">{title}</p>
              {sub && <p className="stat-sub">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="card chart-card">
          <h3 className="chart-title">Pendapatan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => v} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} labelStyle={{ color: 'var(--text)' }} formatter={(v: number) => [v.toFixed(2), 'Total']} />
              <Area type="monotone" dataKey="total" stroke="#38bdf8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title">Pelanggan per Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={userByStatus.length ? userByStatus : [{ status: 'No data', count: 1 }]}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {(userByStatus.length ? userByStatus : [{ status: 'No data', count: 1 }]).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card chart-card" style={{ marginTop: '1rem' }}>
          <h3 className="chart-title">Top 10 Pelanggan by Data Terpakai (MB)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topUsersByData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
            <YAxis type="category" dataKey="username" stroke="var(--text-muted)" fontSize={11} width={70} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [v + ' MB', 'Data used']} />
            <Bar dataKey="data_used_mb" fill="#38bdf8" radius={[0, 4, 4, 0]} name="MB" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        .stat-card { display: flex; align-items: center; gap: 1rem; }
        .stat-icon { width: 52px; height: 52px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-value { margin: 0; font-size: 1.4rem; font-weight: 700; }
        .stat-label { margin: 0.25rem 0 0 0; font-size: 0.9rem; color: var(--text-muted); }
        .stat-sub { margin: 0.15rem 0 0 0; font-size: 0.75rem; color: var(--text-muted); }
        .dashboard-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
        .chart-card { overflow: hidden; }
        .chart-title { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; color: var(--text); }
      `}</style>
    </div>
  )
}
