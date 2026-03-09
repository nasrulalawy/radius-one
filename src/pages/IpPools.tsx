import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { IpPool } from '../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function IpPools() {
  const [list, setList] = useState<IpPool[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<IpPool | null>(null)
  const [form, setForm] = useState({ name: '', range_start: '', range_end: '', description: '' })

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('ip_pools').select('*').order('name')
    if (error) alert('Gagal load: ' + error.message)
    else setList((data as IpPool[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim() || !form.range_start.trim() || !form.range_end.trim()) {
      alert('Nama, range start, dan range end wajib')
      return
    }
    const payload = {
      name: form.name.trim(),
      range_start: form.range_start.trim(),
      range_end: form.range_end.trim(),
      description: form.description?.trim() || null,
    }
    if (editing) {
      const { error } = await supabase.from('ip_pools').update(payload).eq('id', editing.id)
      if (error) { alert('Gagal update: ' + error.message); return }
    } else {
      const { error } = await supabase.from('ip_pools').insert(payload)
      if (error) { alert('Gagal tambah: ' + error.message); return }
    }
    setModal(null)
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus IP pool ini?')) return
    const { error } = await supabase.from('ip_pools').delete().eq('id', id)
    if (error) { alert('Gagal hapus: ' + error.message); return }
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>IP Pool</h1>
        <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', range_start: '', range_end: '', description: '' }); setModal('add'); }}>
          <Plus size={18} /> Tambah IP Pool
        </button>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Nama</th><th>Range awal</th><th>Range akhir</th><th>Deskripsi</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.range_start}</td>
                  <td>{r.range_end}</td>
                  <td>{r.description ?? '-'}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditing(r); setForm({ name: r.name, range_start: r.range_start, range_end: r.range_end, description: r.description ?? '' }); setModal('edit'); }}><Pencil size={16} /></button>
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
            <h2 style={{ margin: '0 0 1rem 0' }}>{modal === 'add' ? 'Tambah IP Pool' : 'Edit IP Pool'}</h2>
            <div className="form-group"><label>Nama pool *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Pool-1" /></div>
            <div className="form-group"><label>IP range awal *</label><input value={form.range_start} onChange={(e) => setForm((f) => ({ ...f, range_start: e.target.value }))} placeholder="192.168.1.1" /></div>
            <div className="form-group"><label>IP range akhir *</label><input value={form.range_end} onChange={(e) => setForm((f) => ({ ...f, range_end: e.target.value }))} placeholder="192.168.1.254" /></div>
            <div className="form-group"><label>Deskripsi</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Opsional" /></div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}><button type="button" className="btn btn-primary" onClick={save}>Simpan</button><button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button></div>
          </div>
        </div>
      )}
      <style>{`.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1rem; } .modal { max-width: 420px; width: 100%; }`}</style>
    </div>
  )
}
