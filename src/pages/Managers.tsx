import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminProfile } from '../lib/supabase'
import { Pencil } from 'lucide-react'

export default function Managers() {
  const [list, setList] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminProfile | null>(null)
  const [role, setRole] = useState('admin')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('admin_profiles').select('*').order('username')
    if (error) {
      alert('Gagal load: ' + error.message)
    } else {
      setList((data as AdminProfile[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveRole = async () => {
    if (!editing) return
    const { error } = await supabase.from('admin_profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', editing.id)
    if (error) {
      alert('Gagal update: ' + error.message)
      return
    }
    setEditing(null)
    load()
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Manajer</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
        Daftar admin/operator. Tambah pengguna via Supabase Dashboard → Authentication → Users.
      </p>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : (
          <table>
            <thead><tr><th>Username</th><th>Nama lengkap</th><th>Peran</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.username}</td>
                  <td>{r.full_name ?? '-'}</td>
                  <td>
                    {editing?.id === r.id ? (
                      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="badge badge-muted">{r.role}</span>
                    )}
                  </td>
                  <td>
                    {editing?.id === r.id ? (
                      <>
                        <button type="button" className="btn btn-primary" onClick={saveRole}>Simpan</button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Batal</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditing(r); setRole(r.role); }}><Pencil size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
