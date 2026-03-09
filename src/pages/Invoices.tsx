import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Download } from 'lucide-react'

type Invoice = { id: string; user_id: string | null; amount: number; status: string; due_date: string | null; paid_at: string | null; notes: string | null; created_at: string }
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

type InvoicesProps = { defaultFilter?: { status: string }; pageTitle?: string }

export default function Invoices({ defaultFilter, pageTitle = 'Semua Tagihan' }: InvoicesProps = {}) {
  const [list, setList] = useState<Invoice[]>([])
  const [users, setUsers] = useState<UserOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState({ status: defaultFilter?.status ?? '', date_from: '', date_to: '' })
  const [form, setForm] = useState({ user_id: '', amount: '', due_date: '', notes: '' })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(500)
    setList((data as Invoice[]) ?? [])
    const { data: u } = await supabase.from('radius_users').select('id, username').order('username')
    setUsers((u as UserOpt[]) ?? [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (filter.status && r.status !== filter.status) return false
      if (filter.date_from && r.created_at.slice(0, 10) < filter.date_from) return false
      if (filter.date_to && r.created_at.slice(0, 10) > filter.date_to) return false
      return true
    })
  }, [list, filter])

  useEffect(() => { load() }, [])

  const save = async () => {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { alert('Jumlah harus lebih dari 0'); return }
    if (!form.user_id) { alert('Pilih pelanggan'); return }
    const { error } = await supabase.from('invoices').insert({
      user_id: form.user_id,
      amount,
      due_date: form.due_date || null,
      notes: form.notes || null,
      status: 'pending',
    })
    if (error) { alert('Gagal: ' + error.message); return }
    setModal(false)
    setForm({ user_id: '', amount: '', due_date: '', notes: '' })
    load()
  }

  const markPaid = async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    if (error) { alert('Gagal: ' + error.message); return }
    load()
  }

  const exportCsv = () => {
    const rows = filtered.map((r) => ({
      user: users.find((u) => u.id === r.user_id)?.username ?? '',
      amount: r.amount,
      status: r.status,
      due_date: r.due_date ?? '',
      paid_at: r.paid_at ?? '',
      created_at: r.created_at,
    }))
    downloadCsv(rows, 'invoices-export.csv')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{pageTitle}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={exportCsv} title="Ekspor CSV"><Download size={18} /></button>
          <button type="button" className="btn btn-primary" onClick={() => setModal(true)}><Plus size={18} /> Buat Tagihan</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cari Tagihan</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Status</label><select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}><option value="">Semua</option><option value="pending">Belum lunas</option><option value="paid">Lunas</option><option value="cancelled">Dibatalkan</option></select></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Dari tanggal</label><input type="date" value={filter.date_from} onChange={(e) => setFilter((f) => ({ ...f, date_from: e.target.value }))} /></div>
          <div className="form-group" style={{ marginBottom: 0 }}><label>Sampai tanggal</label><input type="date" value={filter.date_to} onChange={(e) => setFilter((f) => ({ ...f, date_to: e.target.value }))} /></div>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {filtered.length} dari {list.length} tagihan</p>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Pelanggan</th><th>Jumlah</th><th>Status</th><th>Jatuh tempo</th><th>Dibayar pada</th><th>Dibuat</th><th></th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{users.find((u) => u.id === r.user_id)?.username ?? '-'}</td>
                  <td>{Number(r.amount).toFixed(2)}</td>
                  <td><span className={`badge badge-${r.status === 'paid' ? 'success' : r.status === 'cancelled' ? 'danger' : 'warning'}`}>{r.status === 'paid' ? 'Lunas' : r.status === 'cancelled' ? 'Dibatalkan' : 'Belum lunas'}</span></td>
                  <td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : '-'}</td>
                  <td>{r.paid_at ? new Date(r.paid_at).toLocaleString() : '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.status === 'pending' && <button type="button" className="btn btn-ghost" onClick={() => markPaid(r.id)}><Pencil size={14} /> Tandai Lunas</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Buat Tagihan</h2>
            <div className="form-group"><label>Pelanggan *</label><select value={form.user_id} onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}><option value="">-- Pilih pelanggan --</option>{users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
            <div className="form-group"><label>Jumlah (Rp) *</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            <div className="form-group"><label>Jatuh tempo</label><input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></div>
            <div className="form-group"><label>Catatan</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Opsional" /></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="button" className="btn btn-primary" onClick={save}>Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button></div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; }`}</style>
    </div>
  )
}
