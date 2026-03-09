import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../lib/supabase'
import { Plus, Copy } from 'lucide-react'

type Voucher = { id: string; code: string; password: string; service_id: string | null; validity_days: number | null; amount: number; used_at: string | null; created_at: string }

function randomCode(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function Vouchers() {
  const [list, setList] = useState<Voucher[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ count: '1', code_len: '8', password_len: '8', service_id: '', validity_days: '', amount: '0' })
  const [generated, setGenerated] = useState<{ code: string; password: string }[]>([])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false }).limit(100)
    setList((data as Voucher[]) ?? [])
    const { data: s } = await supabase.from('services').select('*').eq('is_active', true)
    setServices((s as Service[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    const count = Math.min(100, Math.max(1, parseInt(form.count, 10) || 1))
    const codeLen = Math.max(4, parseInt(form.code_len, 10) || 8)
    const pwLen = Math.max(4, parseInt(form.password_len, 10) || 8)
    const validity = form.validity_days ? parseInt(form.validity_days, 10) : null
    const amount = parseFloat(form.amount) || 0
    const serviceId = form.service_id || null
    const rows: { code: string; password: string; service_id: string | null; validity_days: number | null; amount: number }[] = []
    const seen = new Set<string>()
    for (let i = 0; i < count; i++) {
      let code = randomCode(codeLen)
      while (seen.has(code)) code = randomCode(codeLen)
      seen.add(code)
      const password = randomCode(pwLen)
      rows.push({ code, password, service_id: serviceId, validity_days: validity, amount })
    }
    const { error } = await supabase.from('vouchers').insert(rows)
    if (error) { alert('Gagal: ' + error.message); return }
    setGenerated(rows.map((r) => ({ code: r.code, password: r.password })))
    setModal(false)
    load()
  }

  const copyAll = () => {
    const text = generated.map((g) => `${g.code}\t${g.password}`).join('\n')
    navigator.clipboard.writeText(text)
    alert('Disalin ke clipboard')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Kartu Voucher</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setModal(true); setGenerated([]); }}><Plus size={18} /> Generate Voucher</button>
      </div>
      {generated.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Voucher baru ({generated.length})</strong>
            <button type="button" className="btn btn-ghost" onClick={copyAll}><Copy size={16} /> Salin</button>
          </div>
          <div style={{ maxHeight: 200, overflow: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {generated.map((g, i) => (
              <div key={i}>{g.code} / {g.password}</div>
            ))}
          </div>
        </div>
      )}
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Kode</th><th>Password</th><th>Profil paket</th><th>Masa aktif (hari)</th><th>Nilai (Rp)</th><th>Terpakai</th><th>Dibuat</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>••••••••</td>
                  <td>{services.find((s) => s.id === r.service_id)?.name ?? '-'}</td>
                  <td>{r.validity_days != null ? r.validity_days + ' hari' : '-'}</td>
                  <td>{r.amount}</td>
                  <td>{r.used_at ? new Date(r.used_at).toLocaleDateString() : '-'}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Generate Voucher</h2>
            <div className="form-group"><label>Jumlah voucher (1–100)</label><input type="number" min={1} max={100} value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))} placeholder="1" /></div>
            <div className="form-group"><label>Panjang kode</label><input type="number" value={form.code_len} onChange={(e) => setForm((f) => ({ ...f, code_len: e.target.value }))} placeholder="8" /></div>
            <div className="form-group"><label>Panjang password</label><input type="number" value={form.password_len} onChange={(e) => setForm((f) => ({ ...f, password_len: e.target.value }))} placeholder="8" /></div>
            <div className="form-group"><label>Profil paket (opsional)</label><select value={form.service_id} onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}><option value="">-- Pilih paket --</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="form-group"><label>Masa aktif (hari)</label><input type="number" value={form.validity_days} onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))} placeholder="Opsional" /></div>
            <div className="form-group"><label>Nilai (Rp)</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="button" className="btn btn-primary" onClick={generate}>Generate</button><button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Batal</button></div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; }`}</style>
    </div>
  )
}
