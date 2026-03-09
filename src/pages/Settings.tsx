import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('key, value')
      const map: Record<string, string> = {}
      ;(data ?? []).forEach((r: { key: string; value: unknown }) => {
        const v = r.value
        map[r.key] = typeof v === 'string' ? v : JSON.stringify(v ?? '')
      })
      setSettings(map)
      setLoading(false)
    }
    load()
  }, [])

  const update = (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      let val: unknown = value
      if (value === 'true' || value === 'false') val = value === 'true'
      else if (/^\d+$/.test(value)) val = parseInt(value, 10)
      else if (key === 'radius_server_address') val = value
      else if (key !== 'company_name') val = value
      else val = JSON.stringify(value)
      await supabase.from('settings').upsert({ key, value: val, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }
    setSaving(false)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Memuat...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Pengaturan Aplikasi</h1>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>Nama perusahaan</label>
          <input
            value={settings.company_name?.replace(/^"|"$/g, '') ?? ''}
            onChange={(e) => update('company_name', JSON.stringify(e.target.value))}
            placeholder="Nama ISP / Hotspot"
          />
        </div>
        <div className="form-group">
          <label>Alamat IP RADIUS Server</label>
          <input
            value={settings.radius_server_address?.replace(/^"|"$/g, '') ?? ''}
            onChange={(e) => update('radius_server_address', e.target.value)}
            placeholder="Contoh: 43.173.164.210"
          />
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            IP server tempat RADIUS server berjalan. Isi alamat ini di MikroTik sebagai RADIUS server.
          </p>
        </div>
        <div className="form-group">
          <label>Port RADIUS Auth</label>
          <input
            type="number"
            value={settings.radius_auth_port ?? '1812'}
            onChange={(e) => update('radius_auth_port', e.target.value)}
            placeholder="1812"
          />
        </div>
        <div className="form-group">
          <label>Port RADIUS Accounting</label>
          <input
            type="number"
            value={settings.radius_acct_port ?? '1813'}
            onChange={(e) => update('radius_acct_port', e.target.value)}
            placeholder="1813"
          />
        </div>
        <div className="form-group">
          <label>Session timeout (detik)</label>
          <input
            type="number"
            value={settings.session_timeout ?? '3600'}
            onChange={(e) => update('session_timeout', e.target.value)}
            placeholder="3600"
          />
        </div>
      </div>
    </div>
  )
}
