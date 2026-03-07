import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiBills, apiBillsFormData, apiSaveBill, apiBillBayar, apiBillsGenerateRecurring } from '../api';

const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

function BillFormModal({ formData, onClose, onSaved }) {
  const [form, setForm] = useState({
    customer_id: '',
    period_start: '',
    period_end: '',
    amount: '',
    due_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const customers = formData?.customers || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await apiSaveBill({
        customer_id: form.customer_id,
        period_start: form.period_start,
        period_end: form.period_end,
        amount: Number(form.amount) || 0,
        due_date: form.due_date || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Tambah Tagihan</h2>
          {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pelanggan</label>
              <select required value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="">-- Pilih --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.username} - {c.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Periode mulai</label>
              <input type="date" required value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Periode akhir</label>
              <input type="date" required value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
              <input type="number" min={0} step={1000} required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jatuh tempo</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50">Simpan</button>
              <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Batal</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Bills() {
  const [searchParams] = useSearchParams();
  const unpaidOnly = searchParams.get('unpaid') === '1' || searchParams.get('unpaid') === 'true';
  const [bills, setBills] = useState([]);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [payingId, setPayingId] = useState(null);

  const load = () => apiBills(unpaidOnly).then(setBills).catch((e) => setError(e.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [unpaidOnly]);

  useEffect(() => {
    if (showAddModal) apiBillsFormData().then(setFormData).catch(() => {});
  }, [showAddModal]);

  const handleBayar = async (id) => {
    if (!window.confirm('Tandai tagihan ini sebagai sudah dibayar?')) return;
    setPayingId(id);
    try {
      await apiBillBayar(id, 'manual');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setPayingId(null);
    }
  };

  const handleGenerateRecurring = async () => {
    if (!window.confirm('Generate tagihan berulang untuk bulan depan (pelanggan aktif)?')) return;
    setGenerating(true);
    try {
      await apiBillsGenerateRecurring();
      await load();
      alert('Generate selesai.');
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat tagihan...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">{unpaidOnly ? 'Unpaid Invoice' : 'Tagihan'}</h1>
        <div className="flex gap-2">
          <button type="button" onClick={handleGenerateRecurring} disabled={generating} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50">
            Generate Recurring
          </button>
          <button type="button" onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
            + Tambah Tagihan
          </button>
        </div>
      </div>
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
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
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
                    <td className="py-3 px-4 text-right">
                      {b.status === 'unpaid' && (
                        <button type="button" onClick={() => handleBayar(b.id)} disabled={payingId === b.id} className="text-green-600 hover:underline disabled:opacity-50">
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showAddModal && (
        <BillFormModal
          formData={formData}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { load(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
