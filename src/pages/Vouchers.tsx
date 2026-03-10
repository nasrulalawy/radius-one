import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../lib/supabase'
import { invokeMikrotikFunction } from '../lib/mikrotik-api'
import { Plus, Copy, Wifi, CheckCircle } from 'lucide-react'

type Voucher = { id: string; code: string; password: string; service_id: string | null; router_id: string | null; validity_days: number | null; amount: number; used_at: string | null; created_at: string }

function randomCode(len: number) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function Vouchers() {
  const [list, setList] = useState<Voucher[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [routers, setRouters] = useState<{ id: string; nasname: string; shortname: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ count: '1', code_len: '8', password_len: '8', service_id: '', validity_days: '', amount: '0' })
  const [generated, setGenerated] = useState<{ code: string; password: string }[]>([])
  const [testingRouterId, setTestingRouterId] = useState<string | null>(null)
  const [testVoucher, setTestVoucher] = useState({ code: '', password: '' })
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; voucher?: Voucher } | null>(null)

  const load = async () => {
    setLoading(true)
    const [vouchersRes, servicesRes, nasRes] = await Promise.all([
      supabase.from('vouchers').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('services').select('*').eq('is_active', true),
      supabase.from('nas_devices').select('id, nasname, shortname').order('nasname'),
    ])
    setList((vouchersRes.data as Voucher[]) ?? [])
    setServices((servicesRes.data as Service[]) ?? [])
    setRouters((nasRes.data ?? []) as { id: string; nasname: string; shortname: string | null }[])
    setLoading(false)
  }

  const runTestVoucher = async () => {
    const code = testVoucher.code.trim()
    const password = testVoucher.password.trim()
    if (!code) {
      setTestResult({ valid: false, message: 'Isi kode voucher.' })
      return
    }
    setTestResult(null)
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle()
    if (error) {
      setTestResult({ valid: false, message: 'Gagal cek: ' + error.message })
      return
    }
    const v = data as Voucher | null
    if (!v) {
      setTestResult({ valid: false, message: 'Voucher tidak ditemukan (kode salah).' })
      return
    }
    if (password && v.password !== password) {
      setTestResult({ valid: false, message: 'Password tidak cocok.' })
      return
    }
    if (v.used_at) {
      setTestResult({
        valid: false,
        message: 'Voucher sudah terpakai pada ' + new Date(v.used_at).toLocaleString() + '.',
        voucher: v,
      })
      return
    }
    const serviceName = services.find((s) => s.id === v.service_id)?.name ?? '-'
    const routerName = v.router_id ? (routers.find((r) => r.id === v.router_id)?.shortname || routers.find((r) => r.id === v.router_id)?.nasname) : '-'
    setTestResult({
      valid: true,
      message: `Voucher valid. Paket: ${serviceName}. Router: ${routerName}. Siap dipakai di hotspot (login dengan kode + password).`,
      voucher: v,
    })
  }

  const checkRouter = async (routerId: string) => {
    setTestingRouterId(routerId)
    const { data, error } = await invokeMikrotikFunction('mikrotik-test', { nas_id: routerId })
    setTestingRouterId(null)
    if (error) {
      alert('Gagal: ' + error.message)
      return
    }
    if (data?.ok) {
      alert('Router OK: ' + (data.message ?? 'Koneksi berhasil. Voucher bisa dipakai di hotspot router ini selama RADIUS server mengizinkan.'))
    } else {
      alert('Router: ' + (data?.message ?? 'Tidak terjangkau. Cek IP/API di halaman Router [NAS].'))
    }
  }

  useEffect(() => { load() }, [])

  const generate = async () => {
    const count = Math.min(100, Math.max(1, parseInt(form.count, 10) || 1))
    const codeLen = Math.max(4, parseInt(form.code_len, 10) || 8)
    const pwLen = Math.max(4, parseInt(form.password_len, 10) || 8)
    const validity = form.validity_days ? parseInt(form.validity_days, 10) : null
    const amount = parseFloat(form.amount) || 0
    const serviceId = form.service_id || null
    const selectedService = serviceId ? services.find((s) => s.id === serviceId) : null
    const routerId = selectedService?.router_id ?? null
    const rows: { code: string; password: string; service_id: string | null; router_id: string | null; validity_days: number | null; amount: number }[] = []
    const seen = new Set<string>()
    for (let i = 0; i < count; i++) {
      let code = randomCode(codeLen)
      while (seen.has(code)) code = randomCode(codeLen)
      seen.add(code)
      const password = randomCode(pwLen)
      rows.push({ code, password, service_id: serviceId, router_id: routerId, validity_days: validity, amount })
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
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Uji voucher (tanpa Winbox)</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Di <strong>Winbox tidak ada fitur</strong> untuk menguji voucher. Gunakan <strong>Uji voucher</strong> di bawah: masukkan kode (+ password opsional), lalu cek apakah voucher valid di database dan belum terpakai.
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Tombol <strong>Cek router</strong> di tabel menguji koneksi cloud ke router. Jika router jauh/NAT, uji voucher tetap bisa dipakai untuk memastikan kode &amp; password benar.
        </p>
        <ol style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <li>Pastikan di MikroTik, RADIUS server mengarah ke server Anda (Pengaturan &amp; halaman Router [NAS]).</li>
          <li>Di hotspot, pelanggan login dengan <strong>Kode</strong> dan <strong>Password</strong> voucher.</li>
        </ol>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Uji voucher</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cek apakah voucher ada di database, belum terpakai, dan password cocok.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end', marginTop: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kode</label>
            <input value={testVoucher.code} onChange={(e) => { setTestVoucher((t) => ({ ...t, code: e.target.value })); setTestResult(null) }} placeholder="Kode voucher" style={{ minWidth: 120 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Password</label>
            <input type="password" value={testVoucher.password} onChange={(e) => { setTestVoucher((t) => ({ ...t, password: e.target.value })); setTestResult(null) }} placeholder="Password (opsional)" style={{ minWidth: 120 }} />
          </div>
          <button type="button" className="btn btn-primary" onClick={runTestVoucher}><CheckCircle size={16} /> Uji</button>
        </div>
        {testResult && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius)', background: testResult.valid ? 'var(--success-bg, rgba(34,197,94,0.15))' : 'var(--danger-bg, rgba(239,68,68,0.15))', color: testResult.valid ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)', fontSize: '0.9rem' }}>
            {testResult.valid ? '✓ ' : '✗ '}{testResult.message}
          </div>
        )}
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
            <thead><tr><th>Kode</th><th>Password</th><th>Profil paket</th><th>Router</th><th>Masa aktif (hari)</th><th>Nilai (Rp)</th><th>Terpakai</th><th>Dibuat</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => {
                const router = r.router_id ? routers.find((x) => x.id === r.router_id) : null
                return (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td style={{ fontFamily: 'var(--font-mono, monospace)' }}>{r.password}</td>
                    <td>{services.find((s) => s.id === r.service_id)?.name ?? '-'}</td>
                    <td>{router ? (router.shortname || router.nasname) : '-'}</td>
                    <td>{r.validity_days != null ? r.validity_days + ' hari' : '-'}</td>
                    <td>{r.amount}</td>
                    <td>{r.used_at ? new Date(r.used_at).toLocaleDateString() : '-'}</td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      {r.router_id && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Uji koneksi ke router MikroTik"
                          disabled={testingRouterId !== null}
                          onClick={() => checkRouter(r.router_id!)}
                        >
                          {testingRouterId === r.router_id ? '...' : <Wifi size={16} />} Cek router
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
