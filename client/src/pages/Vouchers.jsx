import { useState, useEffect } from 'react';
import { apiVouchers, apiVouchersGenerateForm, apiVouchersGenerate } from '../api';

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [genForm, setGenForm] = useState({ router_id: '', package_id: '', prefix: 'V', count: 10, duration_minutes: 60 });

  const load = () => {
    apiVouchers()
      .then(setVouchers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    apiVouchersGenerateForm().then(setFormData).catch(() => {});
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenLoading(true);
    setError('');
    try {
      await apiVouchersGenerate(genForm);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Voucher Hotspot</h1>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Generate Voucher</h2>
        <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Router</label>
            <select value={genForm.router_id} onChange={(e) => setGenForm({ ...genForm, router_id: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg" required>
              <option value="">Pilih</option>
              {(formData?.routers || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Paket</label>
            <select value={genForm.package_id} onChange={(e) => setGenForm({ ...genForm, package_id: e.target.value })} className="px-3 py-2 border border-slate-300 rounded-lg">
              <option value="">Opsional</option>
              {(formData?.packages || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Prefix</label>
            <input type="text" value={genForm.prefix} onChange={(e) => setGenForm({ ...genForm, prefix: e.target.value })} className="w-20 px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Jumlah</label>
            <input type="number" min={1} max={100} value={genForm.count} onChange={(e) => setGenForm({ ...genForm, count: e.target.value })} className="w-20 px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Durasi (menit)</label>
            <input type="number" min={1} value={genForm.duration_minutes} onChange={(e) => setGenForm({ ...genForm, duration_minutes: e.target.value })} className="w-24 px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <button type="submit" disabled={genLoading} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50">
            {genLoading ? '...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Kode</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Router</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Paket</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Durasi</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada voucher.</td></tr>
              ) : (
                vouchers.slice(0, 100).map((v) => (
                  <tr key={v.id} className="border-b border-slate-100">
                    <td className="py-2 px-4 font-mono">{v.code}</td>
                    <td className="py-2 px-4">{v.router_name || '-'}</td>
                    <td className="py-2 px-4">{v.package_name || '-'}</td>
                    <td className="py-2 px-4">{v.duration_minutes || '-'} menit</td>
                    <td className="py-2 px-4">{parseInt(v.used, 10) === 1 ? <span className="text-amber-600">Terpakai</span> : <span className="text-green-600">Belum</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {vouchers.length > 100 && <p className="p-3 text-sm text-slate-500">Menampilkan 100 dari {vouchers.length}.</p>}
      </div>
    </div>
  );
}
