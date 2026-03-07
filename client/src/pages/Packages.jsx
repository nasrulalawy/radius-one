import { useState, useEffect } from 'react';
import { apiPackages } from '../api';

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiPackages()
      .then(setPackages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat paket...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Paket</h1>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Harga/bulan</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-slate-500">Belum ada paket.</td></tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{p.name}</td>
                  <td className="py-3 px-4 capitalize">{p.type || '-'}</td>
                  <td className="py-3 px-4">{fmt(p.price_monthly)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
