import { useState, useEffect } from 'react';
import { apiReportsPayments, apiReportsStatistics } from '../api';

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = () => {
    apiReportsPayments(from, to)
      .then((d) => {
        setPayments(d.payments || []);
        setTotal(d.total || 0);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    apiReportsStatistics()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPayments(); }, [from, to]);

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Laporan</h1>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-bold text-sky-600">{stats.paidCount ?? 0}</div>
            <div className="text-sm text-slate-500">Tagihan Lunas</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-bold text-amber-600">{stats.unpaidCount ?? 0}</div>
            <div className="text-sm text-slate-500">Tagihan Belum Lunas</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-bold text-slate-800">{fmt(stats.totalPaid)}</div>
            <div className="text-sm text-slate-500">Total Lunas</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-lg font-bold text-slate-800">{fmt(stats.totalUnpaid)}</div>
            <div className="text-sm text-slate-500">Total Piutang</div>
          </div>
        </div>
      )}
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-800 mb-3">Transaksi (filter tanggal)</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border rounded-lg" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border rounded-lg" />
        </div>
        <p className="text-slate-600 mb-2">Total: {fmt(total)}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-2 px-3">Tanggal</th>
                <th className="text-left py-2 px-3">Pelanggan</th>
                <th className="text-left py-2 px-3">Jumlah</th>
                <th className="text-left py-2 px-3">Metode</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-slate-500">Tidak ada data.</td></tr>
              ) : (
                payments.slice(0, 50).map((p, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-3">{(p.paid_at || '').toString().slice(0, 16)}</td>
                    <td className="py-2 px-3">{p.customer_name || '-'}</td>
                    <td className="py-2 px-3">{fmt(p.amount)}</td>
                    <td className="py-2 px-3">{p.method || '-'}</td>
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
