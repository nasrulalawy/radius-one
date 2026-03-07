import { useState, useEffect } from 'react';
import { apiPackages, apiPackage, apiSavePackage, apiDeletePackage } from '../api';

function PackageFormModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    type: 'pppoe',
    price_monthly: '',
    speed_limit: '',
    validity_days: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (pkg) {
      setForm({
        name: pkg.name || '',
        type: pkg.type || 'pppoe',
        price_monthly: pkg.price_monthly ?? '',
        speed_limit: pkg.speed_limit || '',
        validity_days: pkg.validity_days ?? '',
      });
    }
  }, [pkg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await apiSavePackage({
        id: pkg?.id || undefined,
        name: form.name,
        type: form.type,
        price_monthly: form.price_monthly === '' ? 0 : Number(form.price_monthly),
        speed_limit: form.speed_limit || undefined,
        validity_days: form.validity_days === '' ? undefined : Number(form.validity_days),
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{pkg ? 'Edit Paket' : 'Tambah Paket'}</h2>
          {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Paket</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="pppoe">PPPoE</option>
                <option value="hotspot">Hotspot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Harga per bulan (Rp)</label>
              <input type="number" min={0} step={1000} value={form.price_monthly} onChange={(e) => setForm((f) => ({ ...f, price_monthly: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Speed limit (contoh: 10M/10M)</label>
              <input type="text" placeholder="Opsional" value={form.speed_limit} onChange={(e) => setForm((f) => ({ ...f, speed_limit: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Validitas voucher (hari) - Hotspot</label>
              <input type="number" placeholder="Opsional" value={form.validity_days} onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
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

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { id }
  const [editingPkg, setEditingPkg] = useState(null);

  const load = () => apiPackages().then(setPackages).catch((e) => setError(e.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (modal && typeof modal === 'object' && modal.id) {
      setEditingPkg(null);
      apiPackage(modal.id).then(setEditingPkg).catch(() => setModal(null));
    } else {
      setEditingPkg(null);
    }
  }, [modal?.id]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus paket "${name}"?`)) return;
    try {
      await apiDeletePackage(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const showForm = modal === 'add' || (modal && typeof modal === 'object' && modal.id && editingPkg);
  const formPkg = modal === 'add' ? null : editingPkg;

  if (loading) return <div className="text-slate-500">Memuat paket...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Paket</h1>
        <button type="button" onClick={() => setModal('add')} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
          + Tambah Paket
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Harga/bulan</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">Belum ada paket.</td></tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 capitalize">{p.type || '-'}</td>
                  <td className="py-3 px-4">{fmt(p.price_monthly)}</td>
                  <td className="py-3 px-4 text-right">
                    <button type="button" onClick={() => setModal({ id: p.id })} className="text-sky-600 hover:underline mr-2">Edit</button>
                    <button type="button" onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showForm && <PackageFormModal pkg={formPkg} onClose={() => { setModal(null); setEditingPkg(null); }} onSaved={load} />}
      {modal && typeof modal === 'object' && modal.id && !editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg px-6 py-4">Memuat...</div>
        </div>
      )}
    </div>
  );
}
