import { useState, useEffect } from 'react';
import { apiCustomers } from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiCustomers()
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat pelanggan...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Pelanggan</h1>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Username</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">Belum ada pelanggan.</td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium">{c.username}</td>
                <td className="py-3 px-4">{c.name || '-'}</td>
                <td className="py-3 px-4 capitalize">{c.type || '-'}</td>
                <td className="py-3 px-4">
                  <span className={"inline-flex px-2 py-0.5 rounded text-xs font-medium " + (c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
