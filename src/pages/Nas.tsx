import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { invokeMikrotikFunction } from '../lib/mikrotik-api'
import type { NasDevice } from '../lib/supabase'
import { Plus, Pencil, Trash2, ExternalLink, BarChart3 } from 'lucide-react'

const PAGE_SIZES = [10, 25, 50, 100]

export default function Nas() {
  const [list, setList] = useState<NasDevice[]>([])
  const [onlineCountByNas, setOnlineCountByNas] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<NasDevice | null>(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)
  const [testLoading, setTestLoading] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [checkAllLoading, setCheckAllLoading] = useState(false)
  const [radiusServerAddress, setRadiusServerAddress] = useState<string>('')
  const [exportScript, setExportScript] = useState<string | null>(null)
  const [form, setForm] = useState({
    auth_port: '1812',
    acct_port: '1813',
    shortname: '',
    time_zone: '+07:00 Asia/Jakarta',
    nasname: '',
    api_port: '8728',
    api_username: '',
    api_password: '',
    secret: '',
    due_notice_url: '',
    description: '',
    type: 'mikrotik',
    server: '',
    community: '',
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('nas_devices').select('*').order('created_at', { ascending: false })
    if (error) {
      alert('Gagal load data: ' + error.message)
    } else {
      setList((data as NasDevice[]) ?? [])
    }
    const { data: sessionCounts } = await supabase.from('sessions').select('nas_id')
    const counts: Record<string, number> = {}
    ;(sessionCounts ?? []).forEach((r: { nas_id: string | null }) => {
      if (r.nas_id) counts[r.nas_id] = (counts[r.nas_id] ?? 0) + 1
    })
    setOnlineCountByNas(counts)
    setLoading(false)
  }

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('key, value').eq('key', 'radius_server_address').maybeSingle()
      if (data?.value != null) setRadiusServerAddress(String(data.value))
    }
    loadSettings()
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return list
    return list.filter(
      (r) =>
        (r.shortname ?? '').toLowerCase().includes(s) ||
        (r.nasname ?? '').toLowerCase().includes(s) ||
        (r.description ?? '').toLowerCase().includes(s) ||
        (r.time_zone ?? '').toLowerCase().includes(s)
    )
  }, [list, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const paginated = useMemo(() => {
    const start = currentPage * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])
  const from = filtered.length === 0 ? 0 : currentPage * pageSize + 1
  const to = filtered.length === 0 ? 0 : Math.min((currentPage + 1) * pageSize, filtered.length)

  const openAdd = () => {
    setEditing(null)
    setForm({
      auth_port: '1812',
      acct_port: '1813',
      shortname: '',
      time_zone: '+07:00 Asia/Jakarta',
      nasname: '',
      api_port: '8728',
      api_username: '',
      api_password: '',
      secret: '',
      due_notice_url: '',
      description: '',
      type: 'mikrotik',
      server: '',
      community: '',
      is_active: true,
    })
    setModal('add')
  }

  const openEdit = (row: NasDevice) => {
    setEditing(row)
    setForm({
      auth_port: row.auth_port?.toString() ?? '1812',
      acct_port: row.acct_port?.toString() ?? '1813',
      shortname: row.shortname ?? '',
      time_zone: row.time_zone ?? '+07:00 Asia/Jakarta',
      nasname: row.nasname,
      api_port: row.api_port?.toString() ?? '8728',
      api_username: row.api_username ?? '',
      api_password: '',
      secret: row.secret,
      due_notice_url: row.due_notice_url ?? '',
      description: row.description ?? '',
      type: row.type,
      server: row.server ?? '',
      community: row.community ?? '',
      is_active: row.is_active,
    })
    setModal('edit')
  }

  const save = async () => {
    if (!form.nasname.trim()) {
      alert('NAS name / IP wajib diisi')
      return
    }
    if (!form.secret.trim()) {
      alert('Secret wajib diisi')
      return
    }
    const payload: Record<string, unknown> = {
      nasname: form.nasname.trim(),
      shortname: form.shortname?.trim() || null,
      type: form.type,
      ports: form.auth_port ? parseInt(form.auth_port, 10) : null,
      auth_port: form.auth_port ? parseInt(form.auth_port, 10) : null,
      acct_port: form.acct_port ? parseInt(form.acct_port, 10) : null,
      time_zone: form.time_zone?.trim() || null,
      api_port: form.api_port ? parseInt(form.api_port, 10) : null,
      api_username: form.api_username?.trim() || null,
      secret: form.secret,
      server: form.server?.trim() || null,
      community: form.community?.trim() || null,
      due_notice_url: form.due_notice_url?.trim() || null,
      description: form.description?.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    if (form.api_password?.trim()) {
      payload.api_password = form.api_password.trim()
    }
    if (editing) {
      const { error } = await supabase.from('nas_devices').update(payload).eq('id', editing.id)
      if (error) {
        alert('Gagal update: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase.from('nas_devices').insert(payload)
      if (error) {
        alert('Gagal tambah NAS: ' + error.message)
        return
      }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus router ini?')) return
    const { error } = await supabase.from('nas_devices').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
      return
    }
    load()
  }

  const testConnection = async () => {
    setTestMessage(null)
    setTestLoading(true)
    try {
      const body = editing
        ? { nas_id: editing.id }
        : {
            address: form.nasname.trim(),
            api_username: form.api_username || 'admin',
            api_password: form.api_password,
          }
      if (!body.address && !(body as { nas_id?: string }).nas_id) {
        setTestMessage('Isi Router Address dulu.')
        setTestLoading(false)
        return
      }
      const { data, error } = await invokeMikrotikFunction('mikrotik-test', body)
      if (error) {
        setTestMessage('Error: ' + error.message)
      } else if (data?.ok) {
        setTestMessage('✓ ' + (data.message || 'Router terkoneksi.'))
        if (editing) load()
      } else {
        const msg = data?.message || 'Koneksi gagal.'
        const isNoPublicIp = /tidak dapat terhubung|pastikan.*www|ip.*dapat diakses/i.test(msg)
        setTestMessage(
          isNoPublicIp
            ? '✗ ' + msg + ' — Jika router tidak punya IP publik (hanya LAN/NAT), ini normal. Login RADIUS & accounting tetap jalan.'
            : '✗ ' + msg
        )
        if (editing) load()
      }
    } catch (e) {
      setTestMessage('Error: ' + (e as Error).message)
    }
    setTestLoading(false)
  }

  const generateExportScript = () => {
    const serverIp = radiusServerAddress || 'RADIUS_SERVER_IP'
    const secret = (editing?.secret || form.secret || 'RADIUS_SECRET').trim() || 'RADIUS_SECRET'
    const authPort = form.auth_port || '1812'
    const acctPort = form.acct_port || '1813'

    const script = [
      '# Script konfigurasi dasar RADIUS untuk RadiusOne',
      '# Sesuaikan RADIUS_SERVER_IP dan RADIUS_SECRET jika perlu',
      '',
      '/radius',
      `add service=pppoe,hotspot,address-list authenticate=yes accounting=yes \\`,
      `    address=${serverIp} secret="${secret}" \\`,
      `    authentication-port=${authPort} accounting-port=${acctPort} timeout=300ms disabled=no`,
      '',
      '/ppp profile',
      'set default use-radius=yes',
      'set default-encryption use-radius=yes',
      '',
      '/ip hotspot profile',
      'set [ find default=yes ] use-radius=yes',
      '',
      '# Optional: interval accounting (update setiap 5 menit)',
      `/radius`,
      `set [find address=${serverIp}] accounting-backup=no accounting-interval=00:05:00`,
      '',
      '# Catatan:',
      '# - address      : IP server RADIUS (RadiusOne backend / radius-server).',
      '# - secret       : sama dengan Radius Secret di halaman Router [NAS].',
      '# - Router Address di RadiusOne: isi dengan IP MikroTik yang dipakai kirim RADIUS (LAN/VPN).',
    ].join('\n')

    setExportScript(script)
  }

  const checkAllRouters = async () => {
    setCheckAllLoading(true)
    try {
      const { data, error } = await invokeMikrotikFunction('mikrotik-check-all')
      if (error) alert('Error: ' + error.message)
      else if (data?.ok) {
        alert(`Selesai. ${data.checked} router dicek.`)
        load()
      } else alert(data?.message || 'Gagal cek router.')
    } catch (e) {
      alert('Error: ' + (e as Error).message)
    }
    setCheckAllLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Routers [NAS]</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={checkAllRouters} disabled={checkAllLoading || list.length === 0}>
            {checkAllLoading ? 'Mengecek...' : 'Cek Semua Router'}
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={18} /> ADD ROUTER [NAS]
          </button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>INFO:</p>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <li>Status ping router dicek oleh sistem setiap 5 menit</li>
          <li>Tabel router diperbarui setiap 1 menit</li>
          {radiusServerAddress ? (
            <li>
              <strong>Alamat RADIUS server</strong> (isi di MikroTik): <code style={{ background: 'var(--bg-elev)', padding: '0.1rem 0.35rem', borderRadius: 4 }}>{radiusServerAddress}</code>
            </li>
          ) : null}
          <li><strong>Export konfigurasi profil ke router</strong> (sync ke MikroTik): saat ini tidak tersedia; validasi paket dilakukan via RADIUS server.</li>
          <li><strong>Router tanpa IP publik</strong> (hanya LAN / di belakang NAT): Test Connection & Cek Semua akan gagal — itu normal. <strong>Login RADIUS dan accounting tetap berfungsi</strong> (MikroTik yang kirim ke server). Isi Router Address dengan IP yang dipakai MikroTik untuk kirim RADIUS (LAN atau IP di VPN).</li>
        </ul>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Show</label>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
            style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n} entries</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Search:</label>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Cari nama, IP, deskripsi..."
            style={{ padding: '0.35rem 0.6rem', width: 220, borderRadius: 6, border: '1px solid var(--border)' }}
          />
        </div>
      </div>
      <div className="card table-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>API</th>
                  <th>Ping Status</th>
                  <th>Router Name</th>
                  <th>IP Address</th>
                  <th>Time Zone</th>
                  <th>Description</th>
                  <th>Online Users</th>
                  <th>Last Checked</th>
                  <th style={{ width: 120 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => {
                  const online = onlineCountByNas[row.id] ?? 0
                  return (
                    <tr key={row.id}>
                      <td>
                        <button type="button" className="btn btn-ghost" style={{ padding: '0.25rem' }} title="API Features">
                          <ExternalLink size={16} />
                        </button>
                      </td>
                      <td>
                        {row.ping_status === 'online' ? (
                          <span className="badge badge-success" title={row.last_checked ? new Date(row.last_checked).toLocaleString() : ''}>✔ online</span>
                        ) : row.ping_status === 'timeout' ? (
                          <span className="badge" style={{ background: 'var(--warning)', color: 'var(--bg)' }} title={row.last_checked ? new Date(row.last_checked).toLocaleString() : ''}>✖ timeout</span>
                        ) : (
                          <span className="badge badge-muted" title="Klik Test Connection di form Edit">—</span>
                        )}
                      </td>
                      <td>{row.shortname || row.nasname || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.9rem' }}>{row.nasname}</td>
                      <td style={{ fontSize: '0.85rem' }}>{row.time_zone ?? '—'}</td>
                      <td style={{ fontSize: '0.9rem', maxWidth: 180 }}>{row.description ?? '—'}</td>
                      <td>
                        {online > 0 ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <BarChart3 size={14} style={{ color: 'var(--text-muted)' }} />
                            active {online}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{row.last_checked ? new Date(row.last_checked).toLocaleString() : '—'}</td>
                      <td>
                        <button type="button" className="btn btn-ghost" onClick={() => openEdit(row)} title="Edit"><Pencil size={16} /></button>
                        <button type="button" className="btn btn-ghost" onClick={() => remove(row.id)} title="Delete" style={{ color: 'var(--warning)' }}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span>Showing {from} to {to} of {filtered.length} entries</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button type="button" className="btn btn-ghost" disabled={currentPage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</button>
                <span style={{ padding: '0.25rem 0.5rem' }}>{currentPage + 1}</span>
                <button type="button" className="btn btn-ghost" disabled={currentPage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal card nas-form" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 0.5rem 0' }}>{modal === 'add' ? 'Tambah Router [NAS]' : 'Edit Router [NAS]'}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Panduan Dasar</p>

            <div className="form-group">
              <label>Authentication Port *</label>
              <input type="number" value={form.auth_port} onChange={(e) => setForm((f) => ({ ...f, auth_port: e.target.value }))} placeholder="1812" />
            </div>
            <div className="form-group">
              <label>Accounting Port *</label>
              <input type="number" value={form.acct_port} onChange={(e) => setForm((f) => ({ ...f, acct_port: e.target.value }))} placeholder="1813" />
            </div>
            <div className="form-group">
              <label>Router Name *</label>
              <input value={form.shortname} onChange={(e) => setForm((f) => ({ ...f, shortname: e.target.value }))} placeholder="NAS SITE-1" />
            </div>
            <div className="form-group">
              <label>Time Zone</label>
              <select value={form.time_zone} onChange={(e) => setForm((f) => ({ ...f, time_zone: e.target.value }))}>
                <option value="+07:00 Asia/Jakarta">+07:00 Asia/Jakarta</option>
                <option value="+08:00 Asia/Makassar">+08:00 Asia/Makassar</option>
                <option value="+09:00 Asia/Jayapura">+09:00 Asia/Jayapura</option>
                <option value="+07:00 Asia/Bangkok">+07:00 Asia/Bangkok</option>
                <option value="+08:00 Asia/Singapore">+08:00 Asia/Singapore</option>
                <option value="+00:00 UTC">+00:00 UTC</option>
              </select>
            </div>
            <div className="form-group">
              <label>Router Address *</label>
              <input value={form.nasname} onChange={(e) => setForm((f) => ({ ...f, nasname: e.target.value }))} placeholder="192.168.1.1 atau mydomain.com" />
            </div>
            <div className="form-group">
              <label>API Port</label>
              <input type="number" value={form.api_port} onChange={(e) => setForm((f) => ({ ...f, api_port: e.target.value }))} placeholder="8728" />
            </div>
            <div className="form-group">
              <label>API Username</label>
              <input value={form.api_username} onChange={(e) => setForm((f) => ({ ...f, api_username: e.target.value }))} placeholder="API Username" />
            </div>
            <div className="form-group">
              <label>API Password</label>
              <input type="password" value={form.api_password} onChange={(e) => setForm((f) => ({ ...f, api_password: e.target.value }))} placeholder="API Password" />
              {modal === 'edit' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kosongkan jika tidak diubah</span>}
            </div>
            <div className="form-group">
              <label>Radius Secret *</label>
              <input type="password" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="Radius Secret" />
            </div>
            <div className="form-group">
              <label>Due Notice Url (Opsional)</label>
              <input value={form.due_notice_url} onChange={(e) => setForm((f) => ({ ...f, due_notice_url: e.target.value }))} placeholder="mydomain.com/expired.html" />
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full path URL tanpa http:// atau https://. Untuk redirect pelanggan PPPoE yang kadaluarsa. Pastikan URL tersebut dapat diakses oleh MikroTik.</p>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} style={{ resize: 'vertical', minHeight: 56 }} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="nas_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="nas_active" style={{ margin: 0 }}>Aktif</label>
            </div>
            {testMessage && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: testMessage.startsWith('✓') ? 'var(--success)' : 'var(--text-muted)' }}>{testMessage}</p>
            )}
            {exportScript && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Script Mikrotik (copy-paste ke terminal):
                </label>
                <textarea
                  value={exportScript}
                  readOnly
                  rows={10}
                  style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem', resize: 'vertical' }}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={save}>{modal === 'add' ? 'Tambah Router' : 'Simpan'}</button>
              <button type="button" className="btn btn-ghost" onClick={testConnection} disabled={testLoading}>
                {testLoading ? 'Mengecek...' : 'Test Connection'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={generateExportScript}
                disabled={!radiusServerAddress && !form.auth_port}
                title={radiusServerAddress ? 'Generate script konfigurasi RADIUS di MikroTik' : 'Isi dulu alamat RADIUS server di Settings'}
              >
                Export Script MikroTik
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setModal(null)
                  setTestMessage(null)
                  setExportScript(null)
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .modal {
          max-width: 420px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
