import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { apiAppSettings, apiSaveAppSettings, apiAppSettingsAddAdmin } from '../api';

const tabs = [
  { path: '/app-settings', label: 'Semua' },
  { path: '/app-settings/general', label: 'General' },
  { path: '/app-settings/radius', label: 'RADIUS' },
  { path: '/app-settings/localisation', label: 'Localisation' },
  { path: '/app-settings/invoice-logo', label: 'Invoice Logo' },
];

export default function AppSettings() {
  const location = useLocation();
  const tab = location.pathname.replace('/app-settings', '') || '/';
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

  const showGeneral = tab === '/' || tab === '/general';
  const showRadius = tab === '/' || tab === '/general' || tab === '/radius';
  const showLocalisation = tab === '/' || tab === '/localisation';
  const showInvoiceLogo = tab === '/' || tab === '/invoice-logo';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">App Settings</h1>
        <nav className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          {tabs.map((t) => (
            <NavLink
              key={t.path}
              to={t.path}
              end={t.path === '/app-settings'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium ${isActive ? 'bg-white text-sky-600 shadow' : 'text-slate-600 hover:text-slate-800'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {saved && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">Pengaturan disimpan.</div>}
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {showGeneral && (
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
      )}

      {showRadius && (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2">RADIUS (shared secret)</h2>
        <p className="text-sm text-slate-600 mb-4">
          Secret ini Anda tentukan sendiri (bisa string acak). Nilai yang sama harus dipasang di <strong>dua tempat</strong>: (1) di RADIUS server (mis. FreeRADIUS, di konfigurasi clients) dan (2) di MikroTik router: <code className="bg-slate-100 px-1 rounded">/radius add service=hotspot,ppp address=&lt;IP_RADIUS_SERVER&gt; secret=&lt;isi_secret_ini&gt;</code>
        </p>
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">RADIUS shared secret</label>
            <input type="password" value={settings.radius_secret || ''} onChange={(e) => setSettings({ ...settings, radius_secret: e.target.value })} placeholder="Contoh: rahasia-radius-anda" className="w-full px-3 py-2 border border-slate-300 rounded-lg" autoComplete="off" />
            <p className="mt-1 text-xs text-slate-500">Simpan lalu salin ke konfigurasi RADIUS server dan ke MikroTik.</p>
          </div>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Simpan</button>
        </form>
      </div>
      )}

      {showGeneral && (
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
      )}

      {showLocalisation && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Localisation</h2>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zona Waktu</label>
              <input type="text" value={settings.timezone || 'Asia/Jakarta'} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Asia/Jakarta" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bahasa (format tanggal)</label>
              <input type="text" value={settings.locale || 'id-ID'} onChange={(e) => setSettings({ ...settings, locale: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="id-ID" />
            </div>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Simpan</button>
          </form>
        </div>
      )}

      {showInvoiceLogo && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Invoice Logo</h2>
          <p className="text-sm text-slate-600 mb-4">URL logo untuk ditampilkan di invoice. Kosongkan jika tidak pakai logo.</p>
          <form onSubmit={handleSave} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Logo</label>
              <input type="url" value={settings.invoice_logo_url || ''} onChange={(e) => setSettings({ ...settings, invoice_logo_url: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="https://..." />
            </div>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Simpan</button>
          </form>
        </div>
      )}
    </div>
  );
}
