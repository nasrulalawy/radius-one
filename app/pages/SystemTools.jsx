import { useState } from 'react';
import { apiSystemToolsBackup, apiSystemToolsRestore, apiSystemToolsImportUsers } from '../api';

export default function SystemTools() {
  const [backupJson, setBackupJson] = useState('');
  const [importCsv, setImportCsv] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBackup = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiSystemToolsBackup();
      setBackupJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!backupJson.trim()) return;
    setError('');
    setRestoreMsg('');
    try {
      await apiSystemToolsRestore(backupJson);
      setRestoreMsg('Restore berhasil. Halaman akan dimuat ulang.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importCsv.trim()) return;
    setError('');
    setImportResult(null);
    try {
      const res = await apiSystemToolsImportUsers(importCsv);
      setImportResult(res);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">System Tools</h1>
      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {restoreMsg && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{restoreMsg}</div>}
      {importResult && <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">Import: {importResult.imported} berhasil, {importResult.failed} gagal.</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2">Backup</h2>
        <p className="text-sm text-slate-500 mb-2">Unduh data sebagai JSON untuk cadangan.</p>
        <button type="button" onClick={handleBackup} disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50">
          {loading ? 'Memuat...' : 'Ambil Backup'}
        </button>
        {backupJson && (
          <textarea readOnly value={backupJson} rows={12} className="mt-3 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs" />
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2">Restore</h2>
        <p className="text-sm text-slate-500 mb-2">Tempel JSON backup lalu klik Restore. Hati-hati: data saat ini akan diganti.</p>
        <form onSubmit={handleRestore}>
          <textarea value={backupJson} onChange={(e) => setBackupJson(e.target.value)} placeholder='{"database":{...}}' rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs" />
          <button type="submit" className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Restore</button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-2">Import User (CSV)</h2>
        <p className="text-sm text-slate-500 mb-2">Kolom: router_id, package_id, name, username, password, type (hotspot/pppoe), status (active/isolir), address, phone.</p>
        <form onSubmit={handleImport}>
          <textarea value={importCsv} onChange={(e) => setImportCsv(e.target.value)} placeholder="router_id,package_id,name,username,password,type,status&#10;1,1,John,john,123456,pppoe,active" rows={8} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs" />
          <button type="submit" className="mt-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">Import</button>
        </form>
      </div>
    </div>
  );
}
