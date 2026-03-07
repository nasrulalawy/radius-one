import { useState, useEffect } from 'react';
import { apiSupportTickets, apiSaveSupportTicket, apiCloseSupportTicket, apiCustomers } from '../api';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', customer_id: '', priority: 'normal', status: 'open', description: '' });

  const load = () => {
    apiSupportTickets(status === 'all' ? undefined : status)
      .then(setTickets)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]);
  useEffect(() => { apiCustomers().then(setCustomers).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiSaveSupportTicket(form);
      setShowForm(false);
      setForm({ subject: '', customer_id: '', priority: 'normal', status: 'open', description: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = async (id) => {
    try {
      await apiCloseSupportTicket(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
        <div className="flex gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="all">Semua</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button type="button" onClick={() => setShowForm(true)} className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700">Buat Ticket</button>
        </div>
      </div>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 max-w-lg">
          <input type="text" placeholder="Subjek" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="">-- Pelanggan --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.username}</option>
            ))}
          </select>
          <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          <div className="flex gap-2">
            <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-lg">Simpan</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 px-4 py-2 rounded-lg">Batal</button>
          </div>
        </form>
      )}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-4">Subjek</th>
              <th className="text-left py-3 px-4">Pelanggan</th>
              <th className="text-left py-3 px-4">Priority</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada ticket.</td></tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3 px-4">{t.subject}</td>
                  <td className="py-3 px-4">{t.customer_name || '-'}</td>
                  <td className="py-3 px-4">{t.priority}</td>
                  <td className="py-3 px-4">{t.status}</td>
                  <td className="py-3 px-4">
                    {t.status === 'open' && (
                      <button type="button" onClick={() => handleClose(t.id)} className="text-amber-600 hover:underline">Tutup</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
