import { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import {
  apiCustomers,
  apiCustomersFormData,
  apiCustomer,
  apiSaveCustomer,
  apiCustomerIsolir,
  apiCustomerAktifkan,
} from '../api';

function CustomerFormModal({ customer, formData, onClose, onSaved }) {
  const [form, setForm] = useState({
    router_id: '',
    package_id: '',
    name: '',
    username: '',
    password: '',
    type: 'pppoe',
    status: 'active',
    address: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (customer) {
      setForm({
        router_id: String(customer.router_id ?? ''),
        package_id: customer.package_id ? String(customer.package_id) : '',
        name: customer.name || '',
        username: customer.username || '',
        password: '',
        type: customer.type || 'pppoe',
        status: customer.status || 'active',
        address: customer.address || '',
        phone: customer.phone || '',
      });
    } else if (formData) {
      const r = formData.routers?.[0];
      setForm((f) => ({
        ...f,
        router_id: r ? String(r.id) : '',
        package_id: '',
        name: '',
        username: '',
        password: '',
        status: 'active',
      }));
    }
  }, [customer, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      await apiSaveCustomer({
        id: customer?.id || undefined,
        router_id: form.router_id || undefined,
        package_id: form.package_id || undefined,
        name: form.name,
        username: form.username,
        password: form.password || undefined,
        type: form.type,
        status: form.status,
        address: form.address || undefined,
        phone: form.phone || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const routers = formData?.routers || [];
  const packages = formData?.packages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{customer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
          {err && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Router</label>
              <select required value={form.router_id} onChange={(e) => setForm((f) => ({ ...f, router_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="">-- Pilih --</option>
                {routers.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.host})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Paket (opsional)</label>
              <select value={form.package_id} onChange={(e) => setForm((f) => ({ ...f, package_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="">-- Pilih --</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - {p.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggan</label>
              <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username (login PPPoE/Hotspot)</label>
              <input type="text" required value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={customer ? 'Kosongkan jika tidak ubah' : ''} required={!customer} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="pppoe">PPPoE</option>
                <option value="hotspot">Hotspot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="active">Aktif</option>
                <option value="isolir">Isolir</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
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

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { id }
  const [editingCustomer, setEditingCustomer] = useState(null);

  const load = () => apiCustomers().then(setCustomers).catch((e) => setError(e.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (modal) apiCustomersFormData().then(setFormData).catch(() => {});
  }, [modal]);

  useEffect(() => {
    if (modal && typeof modal === 'object' && modal.id) {
      setEditingCustomer(null);
      apiCustomer(modal.id).then(setEditingCustomer).catch(() => setModal(null));
    } else {
      setEditingCustomer(null);
    }
  }, [modal?.id]);

  const handleIsolir = async (id) => {
    if (!window.confirm('Isolir pelanggan ini?')) return;
    try {
      await apiCustomerIsolir(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAktifkan = async (id) => {
    if (!window.confirm('Aktifkan pelanggan ini?')) return;
    try {
      await apiCustomerAktifkan(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const showForm = modal === 'add' || (modal && typeof modal === 'object' && modal.id && editingCustomer != null);
  const formCustomer = modal === 'add' ? null : editingCustomer;

  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type'); // hotspot | pppoe
  const filteredCustomers = typeFilter
    ? customers.filter((c) => (c.type || '').toLowerCase() === typeFilter.toLowerCase())
    : customers;

  if (loading) return <div className="text-slate-500">Memuat pelanggan...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Pelanggan</h1>
        <div className="flex items-center gap-2">
          <nav className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <NavLink to="/customers" end className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Semua</NavLink>
            <NavLink to="/customers?type=hotspot" className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>Hotspot</NavLink>
            <NavLink to="/customers?type=pppoe" className={({ isActive }) => `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}>PPP</NavLink>
          </nav>
          <button type="button" onClick={() => setModal('add')} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
            + Tambah Pelanggan
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Username</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Nama</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">{typeFilter ? `Tidak ada pelanggan tipe ${typeFilter}.` : 'Belum ada pelanggan.'}</td>
              </tr>
            )}
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium">{c.username}</td>
                <td className="py-3 px-4">{c.name || '-'}</td>
                <td className="py-3 px-4 capitalize">{c.type || '-'}</td>
                <td className="py-3 px-4">
                  <span className={"inline-flex px-2 py-0.5 rounded text-xs font-medium " + (c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800')}>
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button type="button" onClick={() => setModal({ id: c.id })} className="text-sky-600 hover:underline">Edit</button>
                  {c.status === 'active' ? (
                    <button type="button" onClick={() => handleIsolir(c.id)} className="text-amber-600 hover:underline">Isolir</button>
                  ) : (
                    <button type="button" onClick={() => handleAktifkan(c.id)} className="text-green-600 hover:underline">Aktifkan</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <CustomerFormModal
          customer={formCustomer}
          formData={formData}
          onClose={() => { setModal(null); setEditingCustomer(null); }}
          onSaved={load}
        />
      )}
      {modal && typeof modal === 'object' && modal.id && editingCustomer === null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg px-6 py-4">Memuat...</div>
        </div>
      )}
    </div>
  );
}
