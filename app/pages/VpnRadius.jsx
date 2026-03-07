import { useState, useEffect } from 'react';
import { apiVpnRadius, apiVpnProfileAdd, apiVpnProfileActivate, apiVpnProfileDelete } from '../api';

export default function VpnRadius() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [newProfile, setNewProfile] = useState({ name: '', server_endpoint: '', server_public_key: '', vpn_network: '' });

  const load = () => {
    apiVpnRadius()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleAddProfile = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiVpnProfileAdd(newProfile);
      setSaved('Profile ditambahkan.');
      setNewProfile({ name: '', server_endpoint: '', server_public_key: '', vpn_network: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleActivate = async (profileId) => {
    setError('');
    try {
      await apiVpnProfileActivate(profileId);
      setSaved('Profile diaktifkan.');
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus profile ini?')) return;
    try {
      await apiVpnProfileDelete(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">VPN Radius</h1>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {saved && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{saved}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Tambah Profile VPN</h2>
        <form onSubmit={handleAddProfile} className="space-y-3 max-w-md">
          <input type="text" value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="Nama" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
          <input type="text" value={newProfile.server_endpoint} onChange={(e) => setNewProfile({ ...newProfile, server_endpoint: e.target.value })} placeholder="Server endpoint" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          <input type="text" value={newProfile.server_public_key} onChange={(e) => setNewProfile({ ...newProfile, server_public_key: e.target.value })} placeholder="Server public key" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          <input type="text" value={newProfile.vpn_network} onChange={(e) => setNewProfile({ ...newProfile, vpn_network: e.target.value })} placeholder="VPN network (e.g. 10.0.0.0/24)" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Tambah</button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Profile VPN</h2>
        {(!data?.profiles || data.profiles.length === 0) ? (
          <p className="text-slate-500">Belum ada profile.</p>
        ) : (
          <ul className="space-y-2">
            {data.profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                <span>{p.name} {data.activeProfile?.id === p.id && <span className="text-green-600 text-sm">(aktif)</span>}</span>
                <span className="flex gap-2">
                  {data.activeProfile?.id !== p.id && (
                    <button type="button" onClick={() => handleActivate(p.id)} className="text-sky-600 hover:underline text-sm">Aktifkan</button>
                  )}
                  <button type="button" onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline text-sm">Hapus</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2">Router</h2>
        <p className="text-sm text-slate-500">Generate & apply WireGuard per router tersedia di halaman EJS. Integrasi penuh bisa ditambahkan di sini.</p>
        {data?.routers?.length > 0 && <p className="mt-2 text-sm">Jumlah router: {data.routers.length}</p>}
      </div>
    </div>
  );
}
