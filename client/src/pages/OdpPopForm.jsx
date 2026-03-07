import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiOdpPopItem, apiSaveOdpPop } from '../api';

export default function OdpPopForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', type: 'odp', area: '', address: '', latitude: '', longitude: '', note: '', status: 'active' });

  useEffect(() => {
    if (!isEdit) return;
    apiOdpPopItem(id)
      .then(setForm)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form };
      if (isEdit) body.id = id;
      await apiSaveOdpPop(body);
      navigate('/odp-pop');
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">{isEdit ? 'Edit ODP/POP' : 'Tambah ODP/POP'}</h1>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
          <select value={form.type || 'odp'} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
            <option value="odp">ODP</option>
            <option value="pop">POP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
          <input type="text" value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
          <textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
            <input type="text" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="-6.xxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
            <input type="text" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="106.xxxx" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
          <textarea value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Simpan</button>
          <button type="button" onClick={() => navigate('/odp-pop')} className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Batal</button>
        </div>
      </form>
    </div>
  );
}
