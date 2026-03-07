import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiOdpPop, apiDeleteOdpPop } from '../api';

export default function OdpPop() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    apiOdpPop()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus "${name}"?`)) return;
    try {
      await apiDeleteOdpPop(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">ODP | POP Data</h1>
        <Link to="/odp-pop/add" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm">
          + Tambah ODP/POP
        </Link>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipe</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Area</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Koordinat</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada data ODP/POP.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4"><span className="font-medium">{item.name}</span><br /><span className="text-slate-500 text-xs">{item.address || '-'}</span></td>
                    <td className="py-3 px-4">{(item.type || '').toUpperCase()}</td>
                    <td className="py-3 px-4">{item.area || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                    </td>
                    <td className="py-3 px-4">{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '-'}</td>
                    <td className="py-3 px-4">
                      <Link to={`/odp-pop/edit/${item.id}`} className="text-sky-600 hover:underline mr-2">Edit</Link>
                      <button type="button" onClick={() => handleDelete(item.id, item.name)} className="text-red-600 hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        <Link to="/odp-pop/map" className="text-sky-600 hover:underline">View Map</Link>
      </p>
    </div>
  );
}
