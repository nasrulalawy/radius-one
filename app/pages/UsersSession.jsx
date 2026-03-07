import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { apiUsersSession } from '../api';

export default function UsersSession() {
  const location = useLocation();
  const tab = location.pathname.includes('/ppp') ? 'ppp' : location.pathname.includes('/hotspot') ? 'hotspot' : null;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiUsersSession()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Memuat...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;
  if (!data) return null;

  const { stats, perRouterLive } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Users Session</h1>
        <nav className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <NavLink to="/users-session" end className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Semua</NavLink>
          <NavLink to="/users-session/hotspot" className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Hotspot</NavLink>
          <NavLink to="/users-session/ppp" className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>PPP</NavLink>
        </nav>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-sky-600">{stats?.hotspotUsers ?? 0}</div>
          <div className="text-sm text-slate-500">Hotspot Users</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-sky-600">{stats?.pppUsers ?? 0}</div>
          <div className="text-sm text-slate-500">PPPoE Users</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-sky-600">{stats?.liveHotspot ?? 0}</div>
          <div className="text-sm text-slate-500">Hotspot Live</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-2xl font-bold text-sky-600">{stats?.livePpp ?? 0}</div>
          <div className="text-sm text-slate-500">PPPoE Live</div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <h2 className="px-4 py-3 font-semibold text-slate-800 border-b border-slate-200">Live Session per Router</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4">Router</th>
                <th className="text-left py-3 px-4">Hotspot</th>
                <th className="text-left py-3 px-4">PPPoE</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(perRouterLive || []).map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 px-4">{row.router?.name}</td>
                  <td className="py-3 px-4">{row.hotspotActive ?? 0}</td>
                  <td className="py-3 px-4">{row.pppActive ?? 0}</td>
                  <td className="py-3 px-4">
                    <span className={row.ok ? 'text-green-600' : 'text-amber-600'}>{row.ok ? 'OK' : (row.error || 'Error')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
