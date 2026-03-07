import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { apiSoftwareLogs } from '../api';

export default function SoftwareLogs() {
  const location = useLocation();
  const isRadiusAuth = location.pathname.includes('/radius-auth');
  const [data, setData] = useState({ logs: [], limit: 200 });
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(200);

  useEffect(() => {
    apiSoftwareLogs(limit)
      .then(setData)
      .catch(() => setData({ logs: [], limit: 200 }))
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">{isRadiusAuth ? 'Radius Auth Log' : 'Software Logs'}</h1>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <NavLink to="/software-logs" end className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Log Aplikasi</NavLink>
            <NavLink to="/software-logs/radius-auth" className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Radius Auth</NavLink>
          </nav>
          <label className="text-sm text-slate-600">Limit</label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value={50}>50</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Waktu</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">User</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Method</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Path</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Status</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">IP</th>
              </tr>
            </thead>
            <tbody>
              {(!data.logs || data.logs.length === 0) ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada log.</td></tr>
              ) : (
                data.logs.map((row) => (
                  <tr key={row.id || row.at + row.path} className="border-b border-slate-100">
                    <td className="py-2 px-3 text-slate-600">{(row.at || '').toString().replace('T', ' ').slice(0, 19)}</td>
                    <td className="py-2 px-3">{row.user_id || '-'}</td>
                    <td className="py-2 px-3">{row.method || '-'}</td>
                    <td className="py-2 px-3 font-mono text-xs">{row.path || '-'}</td>
                    <td className="py-2 px-3">{row.status || '-'}</td>
                    <td className="py-2 px-3">{row.ip || '-'}</td>
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
