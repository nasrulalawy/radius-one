import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type PaymentRow = { id: string; amount: number; method: string | null; created_at: string; user_id: string | null; reference: string | null }

export default function PaymentReport() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPayments, setTotalPayments] = useState(0)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [chartByDay, setChartByDay] = useState<{ date: string; total: number; count: number }[]>([])

  const load = async () => {
    setLoading(true)
    const from = dateFrom + 'T00:00:00'
    const to = dateTo + 'T23:59:59'
    const { data } = await supabase
      .from('payments')
      .select('id, amount, method, created_at, user_id, reference')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false })
    const list = (data as PaymentRow[]) ?? []
    setPayments(list)

    const total = list.reduce((a, r) => a + Number(r.amount), 0)
    setTotalPayments(total)

    const byDay: Record<string, { total: number; count: number }> = {}
    list.forEach((p) => {
      const day = p.created_at.slice(0, 10)
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 }
      byDay[day].total += Number(p.amount)
      byDay[day].count += 1
    })
    setChartByDay(
      Object.entries(byDay)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date: date.slice(5), total: v.total, count: v.count }))
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [dateFrom, dateTo])

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Laporan Pembayaran</h1>

      <div className="card" style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
          <label>Dari</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
          <label>Sampai</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary" onClick={load}>Filter</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-muted)' }}>Total (periode dipilih)</h2>
        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{totalPayments.toFixed(2)}</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{payments.length} transaksi</p>
      </div>

      {chartByDay.length > 0 && (
        <div className="card chart-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Penerimaan per Hari</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="total" name="Total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card table-wrap">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Detail Pembayaran</h3>
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : payments.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Tidak ada data untuk periode ini.</p> : (
          <table>
            <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Metode</th><th>Referensi</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td>{Number(p.amount).toFixed(2)}</td>
                  <td>{p.method ?? '-'}</td>
                  <td>{p.reference ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
