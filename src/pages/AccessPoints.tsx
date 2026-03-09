import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { NasDevice } from '../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const TYPE = 'access_point'

export default function AccessPoints() {
  const [list, setList] = useState<NasDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<NasDevice | null>(null)
  const [form, setForm] = useState({
    nasname: '',
    shortname: '',
    ports: '',
    secret: '',
    server: '',
    description: '',
    is_active: true,
  })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('nas_devices').select('*').eq('type', TYPE).order('created_at', { ascending: false })
    setList((data as NasDevice[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ nasname: '', shortname: '', ports: '', secret: '', server: '', description: '', is_active: true })
    setModal('add')
  }

  const openEdit = (row: NasDevice) => {
    setEditing(row)
    setForm({
      nasname: row.nasname,
      shortname: row.shortname ?? '',
      ports: row.ports?.toString() ?? '',
      secret: row.secret,
      server: row.server ?? '',
      description: row.description ?? '',
      is_active: row.is_active,
    })
    setModal('edit')
  }

  const save = async () => {
    if (!form.nasname.trim() || !form.secret.trim()) { alert('NAS name dan Secret wajib'); return }
    const payload = {
      nasname: form.nasname.trim(),
      shortname: form.shortname?.trim() || null,
      type: TYPE,
      ports: form.ports ? parseInt(form.ports, 10) : null,
      secret: form.secret,
      server: form.server?.trim() || null,
      community: null,
      description: form.description?.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      const { error } = await supabase.from('nas_devices').update(payload).eq('id', editing.id)
      if (error) { alert('Gagal update: ' + error.message); return }
    } else {
      const { error } = await supabase.from('nas_devices').insert(payload)
      if (error) { alert('Gagal tambah: ' + error.message); return }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus Access Point ini?')) return
    const { error } = await supabase.from('nas_devices').delete().eq('id', id)
    if (error) { alert('Gagal hapus: ' + error.message); return }
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Access Point</h1>
        <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Access Point</button>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Nama / IP</th><th>Nama singkat</th><th>Secret</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <td>{row.nasname}</td>
                  <td>{row.shortname ?? '-'}</td>
                  <td>••••••••</td>
                  <td><span className={`badge ${row.is_active ? 'badge-success' : 'badge-muted'}`}>{row.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
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
            <h2 style={{ margin: '0 0 1rem 0' }}>{modal === 'add' ? 'Tambah Access Point' : 'Edit Access Point'}</h2>
            <div className="form-group"><label>Nama / IP *</label><input value={form.nasname} onChange={(e) => setForm((f) => ({ ...f, nasname: e.target.value }))} placeholder="192.168.1.1" /></div>
            <div className="form-group"><label>Nama singkat</label><input value={form.shortname} onChange={(e) => setForm((f) => ({ ...f, shortname: e.target.value }))} /></div>
            <div className="form-group"><label>Port</label><input type="number" value={form.ports} onChange={(e) => setForm((f) => ({ ...f, ports: e.target.value }))} placeholder="1812" /></div>
            <div className="form-group"><label>Secret *</label><input type="password" value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="RADIUS secret" /></div>
            <div className="form-group"><label>Server</label><input value={form.server} onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))} /></div>
            <div className="form-group"><label>Deskripsi</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><input type="checkbox" id="ap_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /><label htmlFor="ap_active" style={{ margin: 0 }}>Aktif</label></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="button" className="btn btn-primary" onClick={save}>Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button></div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; }`}</style>
    </div>
  )
}
