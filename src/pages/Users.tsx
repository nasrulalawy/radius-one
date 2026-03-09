import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { RadiusUser } from '../lib/supabase'
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react'

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

export default function Users() {
  const [users, setUsers] = useState<RadiusUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<RadiusUser | null>(null)
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [filter, setFilter] = useState({ search: '', status: '', group_id: '', expiry_from: '', expiry_to: '' })
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    phone: '',
    address: '',
    service_id: '',
    group_id: '',
    static_ip: '',
    max_sessions: '',
    status: 'active',
    expiry_date: '',
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('radius_users').select('*').order('created_at', { ascending: false })
    if (error) {
      alert('Gagal load data: ' + error.message)
    } else {
      setUsers((data as RadiusUser[]) ?? [])
    }
    const { data: g } = await supabase.from('user_groups').select('id, name').order('name')
    setGroups((g as { id: string; name: string }[]) ?? [])
    const { data: s } = await supabase.from('services').select('id, name').order('name')
    setServices((s as { id: string; name: string }[]) ?? [])
    setLoading(false)
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const search = filter.search.toLowerCase()
      if (search && !u.username.toLowerCase().includes(search) && !(u.full_name || '').toLowerCase().includes(search) && !(u.email || '').toLowerCase().includes(search)) return false
      if (filter.status && u.status !== filter.status) return false
      if (filter.group_id && u.group_id !== filter.group_id) return false
      if (filter.expiry_from && (!u.expiry_date || u.expiry_date < filter.expiry_from)) return false
      if (filter.expiry_to && (!u.expiry_date || u.expiry_date > filter.expiry_to)) return false
      return true
    })
  }, [users, filter])

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({
      username: '',
      password: '',
      email: '',
      full_name: '',
      phone: '',
      address: '',
      service_id: '',
      group_id: '',
      static_ip: '',
      max_sessions: '',
      status: 'active',
      expiry_date: '',
    })
    setModal('add')
  }

  const openEdit = (u: RadiusUser) => {
    setEditing(u)
    setForm({
      username: u.username,
      password: '',
      email: u.email ?? '',
      full_name: u.full_name ?? '',
      phone: u.phone ?? '',
      address: u.address ?? '',
      service_id: u.service_id ?? '',
      group_id: u.group_id ?? '',
      static_ip: u.static_ip ?? '',
      max_sessions: u.max_sessions != null ? String(u.max_sessions) : '',
      status: u.status,
      expiry_date: u.expiry_date ? u.expiry_date.slice(0, 10) : '',
    })
    setModal('edit')
  }

  const save = async () => {
    const payload: Record<string, unknown> = {
      username: form.username,
      email: form.email || null,
      full_name: form.full_name || null,
      phone: form.phone || null,
      address: form.address?.trim() || null,
      service_id: form.service_id || null,
      group_id: form.group_id || null,
      static_ip: form.static_ip?.trim() || null,
      max_sessions: form.max_sessions ? parseInt(form.max_sessions, 10) : null,
      status: form.status,
      expiry_date: form.expiry_date || null,
      updated_at: new Date().toISOString(),
    }
    if (form.password) payload.password = form.password

    if (editing) {
      const { error } = await supabase.from('radius_users').update(payload).eq('id', editing.id)
      if (error) {
        alert('Gagal update: ' + error.message)
        return
      }
    } else {
      if (!form.password) {
        alert('Password wajib untuk pelanggan baru')
        return
      }
      const { error } = await supabase.from('radius_users').insert({ ...payload, password: form.password })
      if (error) {
        alert('Gagal tambah user: ' + error.message)
        return
      }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return
    const { error } = await supabase.from('radius_users').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
      return
    }
    load()
  }

  const exportCsv = () => {
    const rows = filteredUsers.map((u) => ({
      username: u.username,
      full_name: u.full_name ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      address: u.address ?? '',
      group: groups.find((g) => g.id === u.group_id)?.name ?? '',
      service: services.find((s) => s.id === u.service_id)?.name ?? '',
      status: u.status,
      expiry_date: u.expiry_date ?? '',
      static_ip: u.static_ip ?? '',
      max_sessions: u.max_sessions ?? '',
      data_used_mb: u.data_used_mb,
      balance: u.balance,
    }))
    downloadCsv(rows, 'users-export.csv')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>List Pelanggan</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-ghost" onClick={exportCsv} title="Ekspor CSV"><Download size={18} /></button>
          <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Pelanggan</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cari Pelanggan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Cari</label>
            <input placeholder="Username, nama, email" value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
              <option value="">Semua</option>
              <option value="active">Aktif</option>
              <option value="disabled">Nonaktif</option>
              <option value="expired">Kadaluarsa</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Grup</label>
            <select value={filter.group_id} onChange={(e) => setFilter((f) => ({ ...f, group_id: e.target.value }))}>
              <option value="">Semua</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kadaluarsa dari</label>
            <input type="date" value={filter.expiry_from} onChange={(e) => setFilter((f) => ({ ...f, expiry_from: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kadaluarsa sampai</label>
            <input type="date" value={filter.expiry_to} onChange={(e) => setFilter((f) => ({ ...f, expiry_to: e.target.value }))} />
          </div>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menampilkan {filteredUsers.length} dari {users.length} pelanggan</p>
      </div>
      <div className="card table-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Grup</th>
                <th>Status</th>
                <th>IP Statik</th>
                <th>Maks. Sesi</th>
                <th>Kadaluarsa</th>
                <th>Data terpakai</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.full_name ?? '-'}</td>
                  <td>{u.email ?? '-'}</td>
                  <td>{groups.find((g) => g.id === u.group_id)?.name ?? '-'}</td>
                  <td>
                    <span className={`badge badge-${u.status === 'active' ? 'success' : u.status === 'expired' ? 'danger' : 'muted'}`}>
                      {u.status === 'active' ? 'Aktif' : u.status === 'expired' ? 'Kadaluarsa' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>{u.static_ip ?? '-'}</td>
                  <td>{u.max_sessions != null ? u.max_sessions : '-'}</td>
                  <td>{u.expiry_date ? new Date(u.expiry_date).toLocaleDateString() : '-'}</td>
                  <td>{u.data_used_mb} MB</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => openEdit(u)}><Pencil size={16} /></button>
                    <button type="button" className="btn btn-ghost" onClick={() => remove(u.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1rem 0' }}>{modal === 'add' ? 'Tambah Pelanggan' : 'Edit Pelanggan'}</h2>
            <div className="form-group">
              <label>Username *</label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="Username login"
                disabled={!!editing}
              />
            </div>
            {modal === 'add' && (
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
            )}
            {modal === 'edit' && form.password && (
              <div className="form-group">
                <label>Password baru (kosongkan jika tidak diubah)</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
            )}
            <div className="form-group">
              <label>Nama lengkap</label>
              <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Nama pelanggan" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@contoh.com" />
            </div>
            <div className="form-group">
              <label>No. HP / Telepon</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="08xxxxxxxxxx" />
            </div>
            <div className="form-group">
              <label>Alamat</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Alamat lengkap" />
            </div>
            <div className="form-group">
              <label>Grup pelanggan</label>
              <select value={form.group_id} onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}>
                <option value="">-- Tidak ada --</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Profil paket</label>
              <select value={form.service_id} onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}>
                <option value="">-- Tidak ada --</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Aktif</option>
                <option value="disabled">Nonaktif</option>
                <option value="expired">Kadaluarsa</option>
              </select>
            </div>
            <div className="form-group">
              <label>IP statik</label>
              <input placeholder="Contoh: 192.168.1.100" value={form.static_ip} onChange={(e) => setForm((f) => ({ ...f, static_ip: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Maks. sesi bersamaan</label>
              <input type="number" min={0} placeholder="Unlimited" value={form.max_sessions} onChange={(e) => setForm((f) => ({ ...f, max_sessions: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Tanggal kadaluarsa</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={save}>Simpan</button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
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
