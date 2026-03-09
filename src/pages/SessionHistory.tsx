import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '../lib/supabase'

export default function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('sessions').select('*').order('start_time', { ascending: false }).limit(500)
    setSessions((data as Session[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const formatBytes = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KB`
    return `${n} B`
  }

  const disconnect = async (id: string) => {
    if (!confirm('Hapus riwayat sesi ini?')) return
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (error) alert('Gagal: ' + error.message)
    else load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Riwayat Session</h1>
        <button type="button" className="btn btn-ghost" onClick={load}>Muat ulang</button>
      </div>
      <div className="card table-wrap">
        {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat...</p> : sessions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Belum ada riwayat sesi.</p> : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>IP</th>
                <th>Session ID</th>
                <th>Mulai</th>
                <th>Data masuk</th>
                <th>Data keluar</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.username}</td>
                  <td>{s.framed_ip ?? '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.session_id ?? '-'}</td>
                  <td>{new Date(s.start_time).toLocaleString()}</td>
                  <td>{formatBytes(s.data_in)}</td>
                  <td>{formatBytes(s.data_out)}</td>
                  <td><button type="button" className="btn btn-ghost" onClick={() => disconnect(s.id)}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
