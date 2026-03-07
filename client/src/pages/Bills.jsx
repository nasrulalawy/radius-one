import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiBills } from '../api';

const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default function Bills() {
  const [searchParams] = useSearchParams();
  const unpaidOnly = searchParams.get('unpaid') === '1' || searchParams.get('unpaid') === 'true';
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiBills(unpaidOnly)
      .then(setBills)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [unpaidOnly]);

  if (loading) return <div className="text-slate-500">Memuat tagihan...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">{unpaidOnly ? 'Unpaid Invoice' : 'Tagihan'}</h1>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Pelanggan</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Periode</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Jumlah</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Jatuh Tempo</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {unpaidOnly ? 'Tidak ada tagihan belum lunas.' : 'Belum ada tagihan.'}
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">{b.customer_name || '-'} ({b.username || '-'})</td>
                    <td className="py-3 px-4">{b.period_start} - {b.period_end}</td>
                    <td className="py-3 px-4">{formatRupiah(b.amount)}</td>
                    <td className="py-3 px-4">{b.due_date || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          b.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
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
