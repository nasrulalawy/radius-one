import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Download } from 'lucide-react'

type Payment = { id: string; amount: number; method: string | null; reference: string | null; notes: string | null; created_at: string; user_id: string | null }
type UserOpt = { id: string; username: string }

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => String(v ?? '').replace(new RegExp(',', 'g'), ';')
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

type PaymentsProps = { pageTitle?: string }
export default function Payments({ pageTitle }: PaymentsProps = {}) {
  const [list, setList] = useState<Payment[]>([])
  const [users, setUsers] = useState<UserOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ user_id: '', amount: '', method: 'cash', reference: '', notes: '' })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200)
    setList((data as Payment[]) ?? [])
    const { data: u } = await supabase.from('radius_users').select('id, username').order('username')
    setUsers((u as UserOpt[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { alert('Jumlah harus lebih dari 0'); return }
    const { error } = await supabase.from('payments').insert({
      user_id: form.user_id || null,
      amount,
      method: form.method,
      reference: form.reference || null,
      notes: form.notes || null,
    })
    if (error) { alert('Gagal: ' + error.message); return }
    setModal(false)
    setForm({ user_id: '', amount: '', method: 'cash', reference: '', notes: '' })
    load()
  }

  const exportCsv = () => {
    const rows = list.map((p) => ({
      date: new Date(p.created_at).toLocaleString(),
      user: users.find((u) => u.id === p.user_id)?.username ?? '',
      amount: p.amount,
      method: p.method ?? '',
      reference: p.reference ?? '',
    }))
    downloadCsv(rows, 'payments-export.csv')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pageTitle ?? 'Pembayaran'}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={exportCsv} title="Ekspor CSV"><Download size={18} /></button>
          <button type="button" className="btn btn-primary" onClick={() => setModal(true)}><Plus size={18} /> Tambah Pembayaran</button>
        </div>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Jumlah</th><th>Metode</th><th>Referensi</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td>{users.find((u) => u.id === p.user_id)?.username ?? (p.user_id ? '-' : '-')}</td>
                  <td>{Number(p.amount).toFixed(2)}</td>
                  <td>{p.method ?? '-'}</td>
                  <td>{p.reference ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Tambah Pembayaran</h2>
            <div className="form-group"><label>Pelanggan (opsional)</label><select value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}><option value="">-- Pilih pelanggan --</option>{users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
            <div className="form-group"><label>Jumlah (Rp) *</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            <div className="form-group"><label>Metode pembayaran</label><select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}><option value="cash">Tunai</option><option value="transfer">Transfer</option><option value="ewallet">E-Wallet</option><option value="other">Lainnya</option></select></div>
            <div className="form-group"><label>Referensi / No. transaksi</label><input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Opsional" /></div>
            <div className="form-group"><label>Catatan</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opsional" /></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="button" className="btn btn-primary" onClick={save}>Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button></div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; }`}</style>
    </div>
  )
}
