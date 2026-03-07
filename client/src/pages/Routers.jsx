import { useState, useEffect } from 'react';
import {
  apiRouters,
  apiRouter,
  apiSaveRouter,
  apiDeleteRouter,
  apiTestRouter,
} from '../api';

function RouterFormModal({ router, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: '',
    is_ssl: false,
    integration_mode: 'api',
    use_vpn: false,
    vpn_ip: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (router) {
      setForm({
        name: router.name || '',
        host: router.host || '',
        port: router.port ?? 8728,
        username: router.username || '',
        password: '',
        is_ssl: !!router.is_ssl,
        integration_mode: router.integration_mode === 'radius' ? 'radius' : 'api',
        use_vpn: !!router.use_vpn,
        vpn_ip: router.vpn_ip || '',
      });
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await apiSaveRouter({
        id: router?.id || undefined,
        ...form,
        is_ssl: form.is_ssl,
        use_vpn: form.use_vpn,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{router ? 'Edit Router' : 'Tambah Router'}</h2>
          {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Router</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Host / IP</label>
              <input type="text" required placeholder="192.168.88.1" value={form.host} onChange={(e) => setForm((f) => ({ ...f, host: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Port API</label>
              <input type="number" value={form.port} onChange={(e) => setForm((f) => ({ ...f, port: parseInt(e.target.value, 10) || 8728 }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input type="text" required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={router ? 'Kosongkan jika tidak ubah' : ''} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_ssl" checked={form.is_ssl} onChange={(e) => setForm((f) => ({ ...f, is_ssl: e.target.checked }))} />
              <label htmlFor="is_ssl" className="text-sm text-slate-700">Gunakan SSL (port 8729)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mode Integrasi</label>
              <select value={form.integration_mode} onChange={(e) => setForm((f) => ({ ...f, integration_mode: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="api">MikroTik API</option>
                <option value="radius">RADIUS (FreeRADIUS SQL)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="use_vpn" checked={form.use_vpn} onChange={(e) => setForm((f) => ({ ...f, use_vpn: e.target.checked }))} />
              <label htmlFor="use_vpn" className="text-sm text-slate-700">Gunakan VPN Radius</label>
            </div>
            {form.use_vpn && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IP router di jaringan VPN</label>
                <input type="text" placeholder="10.99.0.2" value={form.vpn_ip} onChange={(e) => setForm((f) => ({ ...f, vpn_ip: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50">Simpan</button>
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Batal</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Routers() {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { id }
  const [editingRouter, setEditingRouter] = useState(null);
  const [testingId, setTestingId] = useState(null);

  const load = () => apiRouters().then(setRouters).catch((e) => setError(e.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (modal && typeof modal === 'object' && modal.id) {
      setEditingRouter(null);
      apiRouter(modal.id).then(setEditingRouter).catch(() => setModal(null));
    } else {
      setEditingRouter(null);
    }
  }, [modal?.id]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus router "${name}"?`)) return;
    try {
      await apiDeleteRouter(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      await apiTestRouter(id);
      alert('Koneksi berhasil.');
    } catch (e) {
      alert('Gagal: ' + e.message);
    } finally {
      setTestingId(null);
    }
  };

  const showForm = modal === 'add' || (modal && typeof modal === 'object' && modal.id && editingRouter);
  const formRouter = modal === 'add' ? null : editingRouter;

  if (loading) return <div className="text-slate-500">Memuat router...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Router (NAS)</h1>
        <button type="button" onClick={() => setModal('add')} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
          + Tambah Router
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Host</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Port</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Mode</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {routers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada router.</td>
                </tr>
              ) : (
                routers.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">{r.host || '-'}</td>
                    <td className="py-3 px-4">{r.port || '-'}</td>
                    <td className="py-3 px-4">{r.integration_mode || 'api'}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button type="button" onClick={() => handleTest(r.id)} disabled={testingId === r.id} className="text-slate-600 hover:underline text-xs disabled:opacity-50">Test</button>
                      <button type="button" onClick={() => setModal({ id: r.id })} className="text-sky-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => handleDelete(r.id, r.name)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <RouterFormModal
          router={formRouter}
          onClose={() => { setModal(null); setEditingRouter(null); }}
          onSaved={load}
        />
      )}
      {modal && typeof modal === 'object' && modal.id && !editingRouter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg px-6 py-4">Memuat...</div>
        </div>
      )}
    </div>
  );
}
