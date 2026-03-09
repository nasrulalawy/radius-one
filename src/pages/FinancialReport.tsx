import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

type PaymentRow = { amount: number; method: string | null; created_at: string }
type InvoiceRow = { amount: number; status: string; created_at: string }

const METHOD_COLORS: Record<string, string> = {
  cash: '#22c55e',
  transfer: '#38bdf8',
  ewallet: '#a78bfa',
  other: '#94a3b8',
}

export default function FinancialReport() {
  const [totalPayments, setTotalPayments] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [totalPaidInvoices, setTotalPaidInvoices] = useState(0)
  const [paymentByMethod, setPaymentByMethod] = useState<{ name: string; value: number }[]>([])
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; payments: number; invoices: number }[]>([])
  const [revenueLast12Days, setRevenueLast12Days] = useState<{ date: string; total: number }[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: payments } = await supabase.from('payments').select('amount, method, created_at').order('created_at', { ascending: true })
      const payList = (payments ?? []) as PaymentRow[]

      const totalRev = payList.reduce((a, r) => a + Number(r.amount), 0)
      setTotalPayments(totalRev)

      const methodSum: Record<string, number> = {}
      payList.forEach((p) => {
        const m = p.method || 'other'
        methodSum[m] = (methodSum[m] || 0) + Number(p.amount)
      })
      setPaymentByMethod(Object.entries(methodSum).map(([name, value]) => ({ name, value })))

      const now = new Date()
      const last12: { date: string; total: number }[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const dayPay = payList.filter((p) => p.created_at.startsWith(dateStr))
        last12.push({ date: dateStr.slice(5), total: dayPay.reduce((a, p) => a + Number(p.amount), 0) })
      }
      setRevenueLast12Days(last12)

      const months: Record<string, { payments: number; invoices: number }> = {}
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months[key] = { payments: 0, invoices: 0 }
      }
      payList.forEach((p) => {
        const key = p.created_at.slice(0, 7)
        if (months[key]) months[key].payments += Number(p.amount)
      })
      const { data: inv } = await supabase.from('invoices').select('amount, status, created_at')
      ;(inv ?? []).forEach((r: InvoiceRow) => {
        const key = r.created_at.slice(0, 7)
        if (months[key] && r.status === 'paid') months[key].invoices += Number(r.amount)
      })
      let pending = 0
      let paid = 0
      ;(inv ?? []).forEach((r: InvoiceRow) => {
        const amt = Number(r.amount)
        if (r.status === 'pending') pending += amt
        else if (r.status === 'paid') paid += amt
      })
      setTotalPending(pending)
      setTotalPaidInvoices(paid)
      setRevenueByMonth(
        Object.entries(months)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, v]) => ({ month: month.slice(5) + '/' + month.slice(2, 4), ...v }))
      )

      const { data: recent } = await supabase.from('payments').select('amount, method, created_at').order('created_at', { ascending: false }).limit(15)
      setRecentPayments((recent as PaymentRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>

  return (
    <div className="finance-page">
      <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>Laporan Keuangan</h1>

      <div className="summary-cards">
        <div className="card sum-card">
          <span className="sum-label">Total Penerimaan (Pembayaran)</span>
          <span className="sum-value">{totalPayments.toFixed(2)}</span>
        </div>
        <div className="card sum-card">
          <span className="sum-label">Invoice Lunas</span>
          <span className="sum-value">{totalPaidInvoices.toFixed(2)}</span>
        </div>
        <div className="card sum-card warning">
          <span className="sum-label">Tagihan Belum Lunas</span>
          <span className="sum-value">{totalPending.toFixed(2)}</span>
        </div>
        <div className="card sum-card">
          <span className="sum-label">Total Revenue</span>
          <span className="sum-value highlight">{(totalPayments + totalPaidInvoices).toFixed(2)}</span>
        </div>
      </div>

      <div className="charts-row">
        <div className="card chart-card">
          <h3 className="chart-title">Penerimaan per Hari (12 hari)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueLast12Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => v} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [v.toFixed(2), 'Total']} />
              <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Penerimaan" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3 className="chart-title">Penerimaan per Metode</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={paymentByMethod.length ? paymentByMethod : [{ name: 'No data', value: 1 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value.toFixed(0)}`}
              >
                {(paymentByMethod.length ? paymentByMethod : [{ name: 'No data', value: 1 }]).map((entry, i) => (
                  <Cell key={i} fill={METHOD_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v: number) => [v.toFixed(2), '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card chart-card" style={{ marginTop: '1rem' }}>
        <h3 className="chart-title">Pembayaran vs Tagihan per Bulan (12 bulan)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="payments" name="Pembayaran" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="invoices" name="Tagihan (lunas)" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card table-wrap" style={{ marginTop: '1rem' }}>
        <h3 className="chart-title">15 Pembayaran Terakhir</h3>
        <table>
          <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Metode</th></tr></thead>
          <tbody>
            {recentPayments.map((p, i) => (
              <tr key={i}>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>{Number(p.amount).toFixed(2)}</td>
                <td>{p.method ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
        .sum-card { padding: 1rem; }
        .sum-label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem; }
        .sum-value { font-size: 1.5rem; font-weight: 700; }
        .sum-card.warning .sum-value { color: var(--warning); }
        .sum-value.highlight { color: var(--success); }
        .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
        .chart-card { overflow: hidden; }
        .chart-title { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
      `}</style>
    </div>
  )
}
