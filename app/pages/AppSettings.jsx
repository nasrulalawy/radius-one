import { useState, useEffect } from 'react';
import { apiAppSettings, apiSaveAppSettings, apiAppSettingsAddAdmin } from '../api';

export default function AppSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({});
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    apiAppSettings()
      .then((d) => {
        setData(d);
        setSettings(d.settings || {});
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiSaveAppSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    if (!adminEmail || !adminPassword) return;
    try {
      await apiAppSettingsAddAdmin(adminEmail, adminPassword);
      setAdminMsg('User admin ditambahkan.');
      setAdminEmail('');
      setAdminPassword('');
      const d = await apiAppSettings();
      setData(d);
    } catch (e) {
      setAdminMsg(e.message || 'Gagal');
    }
  };

  if (loading) return <div className="text-slate-500">Memuat...</div>;
  if (error && !data) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">App Settings</h1>
      {saved && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">Pengaturan disimpan.</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Umum</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Aplikasi</label>
            <input type="text" value={settings.app_name || ''} onChange={(e) => setSettings({ ...settings, app_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Perusahaan</label>
            <input type="text" value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <textarea value={settings.company_address || ''} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telepon / Email</label>
            <input type="text" value={settings.company_phone || ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} placeholder="Telepon" className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-2" />
            <input type="email" value={settings.company_email || ''} onChange={(e) => setSettings({ ...settings, company_email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Simbol Mata Uang</label>
            <input type="text" value={settings.currency_symbol || 'Rp'} onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })} className="w-24 px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Invoice</label>
            <textarea value={settings.invoice_note || ''} onChange={(e) => setSettings({ ...settings, invoice_note: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Simpan</button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Admin Users</h2>
        {data?.adminUsers?.length > 0 && (
          <ul className="mb-4 text-sm text-slate-600">
            {data.adminUsers.map((u) => (
              <li key={u.id}>{u.email || u.username}</li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddAdmin} className="flex flex-wrap gap-2 items-end">
          <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Email" className="px-3 py-2 border border-slate-300 rounded-lg" required />
          <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Password" className="px-3 py-2 border border-slate-300 rounded-lg" required />
          <button type="submit" className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Tambah Admin</button>
        </form>
        {adminMsg && <p className="mt-2 text-sm text-slate-600">{adminMsg}</p>}
      </div>
    </div>
  );
}
