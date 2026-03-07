import { useState, useEffect } from 'react';

const BASE = '';
const getCookie = () => ({ credentials: 'include' });

export default function Routers() {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BASE}/api/routers`, getCookie())
      .then((r) => r.json())
      .then((d) => setRouters(d.routers || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat router...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Router (NAS)</h1>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Host</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Port</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Mode</th>
              </tr>
            </thead>
            <tbody>
              {routers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Belum ada router.
                  </td>
                </tr>
              ) : (
                routers.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{r.name}</td>
                    <td className="py-3 px-4">{r.host || '-'}</td>
                    <td className="py-3 px-4">{r.port || '-'}</td>
                    <td className="py-3 px-4">{r.integration_mode || 'api'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
