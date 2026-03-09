import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Group = { id: string; name: string; description: string | null; created_at: string }

export default function UserGroups() {
  const [list, setList] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Group | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('user_groups').select('*').order('name')
    if (error) alert('Gagal load: ' + error.message)
    else setList((data as Group[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) { alert('Nama grup wajib'); return }
    const payload = { name: form.name.trim(), description: form.description?.trim() || null }
    if (editing) {
      const { error } = await supabase.from('user_groups').update(payload).eq('id', editing.id)
      if (error) { alert('Gagal update: ' + error.message); return }
    } else {
      const { error } = await supabase.from('user_groups').insert(payload)
      if (error) { alert('Gagal tambah: ' + error.message); return }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus grup ini?')) return
    const { error } = await supabase.from('user_groups').delete().eq('id', id)
    if (error) { alert('Gagal hapus: ' + error.message); return }
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Grup Pelanggan</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', description: '' }); setModal('add'); }}>
          <Plus size={18} /> Tambah Grup
        </button>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Nama grup</th><th>Deskripsi</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.description ?? '-'}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditing(r); setForm({ name: r.name, description: r.description ?? '' }); setModal('edit'); }}><Pencil size={16} /></button>
                    <button type="button" className="btn btn-ghost" onClick={() => remove(r.id)}><Trash2 size={16} /></button>
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
            <h2 style={{ margin: '0 0 1rem 0' }}>{modal === 'add' ? 'Tambah Grup Pelanggan' : 'Edit Grup Pelanggan'}</h2>
            <div className="form-group"><label>Nama grup *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama grup" /></div>
            <div className="form-group"><label>Deskripsi</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Keterangan grup" /></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={save}>Simpan</button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; }`}</style>
    </div>
  )
}
