import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RadiusUser } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TrafficReport() {
  const [users, setUsers] = useState<RadiusUser[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(15)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('radius_users').select('*').order('data_used_mb', { ascending: false }).limit(100)
      setUsers((data as RadiusUser[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const totalMb = users.reduce((s, u) => s + (u.data_used_mb || 0), 0)
  const totalGb = (totalMb / 1024).toFixed(2)
  const chartData = users.slice(0, limit).map((u) => ({
    username: u.username.length > 12 ? u.username.slice(0, 10) + '..' : u.username,
    full: u.username,
    mb: u.data_used_mb ?? 0,
    gb: ((u.data_used_mb ?? 0) / 1024).toFixed(2),
  }))

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Laporan Traffic</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-muted)' }}>Total data terpakai (semua pelanggan)</h2>
        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{totalGb} GB</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{totalMb.toLocaleString()} MB · {users.length} pelanggan</p>
      </div>

      <div className="card chart-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Top pelanggan by data (MB)</h3>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ padding: '0.4rem 0.6rem', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
            <YAxis type="category" dataKey="username" stroke="var(--text-muted)" fontSize={11} width={85} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
              formatter={(v: number, _n: string, props: { payload?: { full: string; gb: string } }) => {
                const p = props?.payload
                return p ? [v + ' MB (' + p.gb + ' GB)', p.full] : [String(v) + ' MB', '']
              }}
              labelFormatter={() => ''}
            />
            <Bar dataKey="mb" fill="#38bdf8" radius={[0, 4, 4, 0]} name="MB" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card table-wrap">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Detail per pelanggan</h3>
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>#</th><th>Username</th><th>Nama</th><th>Data terpakai (MB)</th><th>Data terpakai (GB)</th><th>% dari total</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td>{i + 1}</td>
                  <td>{u.username}</td>
                  <td>{u.full_name ?? '-'}</td>
                  <td>{(u.data_used_mb ?? 0).toLocaleString()}</td>
                  <td>{((u.data_used_mb ?? 0) / 1024).toFixed(2)}</td>
                  <td>{totalMb > 0 ? (((u.data_used_mb ?? 0) / totalMb) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
