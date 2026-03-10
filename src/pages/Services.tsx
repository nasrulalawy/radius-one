import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Service, NasDevice } from '../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Services() {
  const [list, setList] = useState<Service[]>([])
  const [routers, setRouters] = useState<NasDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    billing_type: 'prepaid' as 'prepaid' | 'postpaid',
    router_id: '',
    data_limit_mb: '',
    speed_limit_down_kbps: '',
    speed_limit_up_kbps: '',
    price: '',
    validity_days: '',
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const [svcRes, nasRes] = await Promise.all([
      supabase.from('services').select('*').order('created_at', { ascending: false }),
      supabase.from('nas_devices').select('*').eq('is_active', true).order('nasname'),
    ])
    if (svcRes.error) {
      alert('Gagal load data: ' + svcRes.error.message)
    } else {
      setList((svcRes.data as Service[]) ?? [])
    }
    if (nasRes.data) setRouters((nasRes.data as NasDevice[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({
      name: '',
      description: '',
      billing_type: 'prepaid',
      router_id: '',
      data_limit_mb: '',
      speed_limit_down_kbps: '',
      speed_limit_up_kbps: '',
      price: '',
      validity_days: '',
      is_active: true,
    })
    setModal('add')
  }

  const openEdit = (row: Service) => {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description ?? '',
      billing_type: row.billing_type,
      router_id: row.router_id ?? '',
      data_limit_mb: row.data_limit_mb?.toString() ?? '',
      speed_limit_down_kbps: row.speed_limit_down_kbps?.toString() ?? '',
      speed_limit_up_kbps: row.speed_limit_up_kbps?.toString() ?? '',
      price: row.price.toString(),
      validity_days: row.validity_days?.toString() ?? '',
      is_active: row.is_active,
    })
    setModal('edit')
  }

  const save = async () => {
    if (!form.name.trim()) {
      alert('Nama layanan wajib diisi')
      return
    }
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      billing_type: form.billing_type,
      router_id: form.router_id || null,
      data_limit_mb: form.data_limit_mb ? parseInt(form.data_limit_mb, 10) : null,
      speed_limit_down_kbps: form.speed_limit_down_kbps ? parseInt(form.speed_limit_down_kbps, 10) : null,
      speed_limit_up_kbps: form.speed_limit_up_kbps ? parseInt(form.speed_limit_up_kbps, 10) : null,
      price: parseFloat(form.price) || 0,
      validity_days: form.validity_days ? parseInt(form.validity_days, 10) : null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await supabase.from('services').update(payload).eq('id', editing.id)
      if (error) {
        alert('Gagal update: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase.from('services').insert(payload)
      if (error) {
        alert('Gagal tambah layanan: ' + error.message)
        return
      }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus profil paket ini?')) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) {
      alert('Gagal hapus: ' + error.message)
      return
    }
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>List Profil Paket</h1>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Tambah Profil Paket
        </button>
      </div>
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>INFO:</p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Pastikan <strong>RADIUS server</strong> dan <strong>router (MikroTik)</strong> sudah dikonfigurasi agar paket berfungsi saat login hotspot. Alamat RADIUS server bisa diatur di Pengaturan Aplikasi dan ditampilkan di halaman Router [NAS].
        </p>
      </div>
      <div className="card table-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama profil</th>
                <th>Router</th>
                <th>Tipe billing</th>
                <th>Batas data</th>
                <th>Kecepatan</th>
                <th>Harga</th>
                <th>Masa aktif</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{routers.find((r) => r.id === row.router_id)?.shortname || routers.find((r) => r.id === row.router_id)?.nasname || '-'}</td>
                  <td><span className="badge badge-muted">{row.billing_type === 'prepaid' ? 'Prepaid' : 'Postpaid'}</span></td>
                  <td>{row.data_limit_mb != null ? `${row.data_limit_mb} MB` : 'Unlimited'}</td>
                  <td>{row.speed_limit_down_kbps != null ? `${row.speed_limit_down_kbps} kbps` : '-'}</td>
                  <td>{row.price}</td>
                  <td>{row.validity_days != null ? `${row.validity_days} hari` : '-'}</td>
                  <td>
                    <span className={`badge ${row.is_active ? 'badge-success' : 'badge-muted'}`}>
                      {row.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => openEdit(row)}><Pencil size={16} /></button>
                    <button type="button" className="btn btn-ghost" onClick={() => remove(row.id)}><Trash2 size={16} /></button>
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
            <h2 style={{ margin: '0 0 1rem 0' }}>{modal === 'add' ? 'Tambah Profil Paket' : 'Edit Profil Paket'}</h2>
            <div className="form-group">
              <label>Nama profil *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama paket" />
            </div>
            <div className="form-group">
              <label>Deskripsi</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Keterangan paket" />
            </div>
            <div className="form-group">
              <label>Tipe billing</label>
              <select value={form.billing_type} onChange={(e) => setForm((f) => ({ ...f, billing_type: e.target.value as 'prepaid' | 'postpaid' }))}>
                <option value="prepaid">Prepaid</option>
                <option value="postpaid">Postpaid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Router (MikroTik/NAS)</label>
              <select value={form.router_id} onChange={(e) => setForm((f) => ({ ...f, router_id: e.target.value }))}>
                <option value="">-- Pilih router --</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.shortname || r.nasname} ({r.nasname})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Batas data (MB)</label>
              <input type="number" value={form.data_limit_mb} onChange={(e) => setForm((f) => ({ ...f, data_limit_mb: e.target.value }))} placeholder="Kosong = unlimited" />
            </div>
            <div className="form-group">
              <label>Kecepatan down (kbps)</label>
              <input type="number" value={form.speed_limit_down_kbps} onChange={(e) => setForm((f) => ({ ...f, speed_limit_down_kbps: e.target.value }))} placeholder="0 = tidak dibatasi" />
            </div>
            <div className="form-group">
              <label>Kecepatan up (kbps)</label>
              <input type="number" value={form.speed_limit_up_kbps} onChange={(e) => setForm((f) => ({ ...f, speed_limit_up_kbps: e.target.value }))} placeholder="0 = tidak dibatasi" />
            </div>
            <div className="form-group">
              <label>Harga (Rp)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Masa aktif (hari)</label>
              <input type="number" value={form.validity_days} onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))} placeholder="Opsional" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="svc_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="svc_active" style={{ margin: 0 }}>Aktif</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={save}>Simpan</button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; }
        .modal { max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; }
      `}</style>
    </div>
  )
}
