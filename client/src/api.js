const BASE = '';
const opts = () => ({ credentials: 'include' });
const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });

async function get(path) {
  const r = await fetch(`${BASE}${path}`, opts());
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || await r.text());
  return r.json();
}
async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, json(body || {}));
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || await r.text());
  return r.json();
}

export async function apiMe() {
  const r = await fetch(`${BASE}/api/me`, opts());
  if (r.status === 401) return null;
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return d.user;
}
export async function apiLogin(username, password) {
  const d = await post('/api/login', { username, password });
  return d.user;
}
export async function apiLogout() {
  await fetch(`${BASE}/api/logout`, { method: 'POST', ...opts() });
}

export const apiDashboard = () => get('/api/dashboard');
export const apiCustomers = async () => (await get('/api/customers')).customers;
export const apiCustomersFormData = () => get('/api/customers/form-data');
export const apiCustomer = (id) => get(`/api/customers/${id}`);
export const apiPackages = async () => (await get('/api/packages')).packages;
export const apiPackage = (id) => get(`/api/packages/${id}`);
export const apiRouters = async () => (await get('/api/routers')).routers;
export const apiRouter = (id) => get(`/api/routers/${id}`);
export const apiBills = (unpaidOnly) => get(`/api/bills${unpaidOnly ? '?unpaid=true' : ''}`).then((d) => d.bills);
export const apiBillsFormData = () => get('/api/bills/form-data');
export const apiReportsPayments = (from, to) => get(`/api/reports/payments?from=${from || ''}&to=${to || ''}`);
export const apiReportsStatistics = () => get('/api/reports/statistics');
export const apiUsersSession = () => get('/api/users-session');
export const apiAppSettings = () => get('/api/app-settings');
export const apiOdpPop = () => get('/api/odp-pop').then((d) => d.items);
export const apiOdpPopItem = (id) => get(`/api/odp-pop/${id}`);
export const apiSupportTickets = (status) => get(`/api/support-tickets?status=${status || 'all'}`).then((d) => d.tickets);
export const apiSupportTicket = (id) => get(`/api/support-tickets/${id}`);
export const apiVouchers = () => get('/api/vouchers').then((d) => d.vouchers);
export const apiVouchersGenerateForm = () => get('/api/vouchers/generate-form');
export const apiVpnRadius = () => get('/api/vpn-radius');
export const apiSoftwareLogs = (limit) => get(`/api/software-logs?limit=${limit || 200}`);
export const apiSystemToolsBackup = () => get('/api/system-tools/backup');

export async function apiSaveRouter(body) {
  await post('/api/routers/save', body);
}
export async function apiDeleteRouter(id) {
  await post(`/api/routers/delete/${id}`);
}
export const apiTestRouter = (id) => get(`/api/routers/test/${id}`);
export async function apiSavePackage(body) {
  await post('/api/packages/save', body);
}
export async function apiDeletePackage(id) {
  await post(`/api/packages/delete/${id}`);
}
export async function apiSaveCustomer(body) {
  return post('/api/customers/save', body);
}
export async function apiCustomerIsolir(id) {
  await post(`/api/customers/isolir/${id}`);
}
export async function apiCustomerAktifkan(id) {
  await post(`/api/customers/aktifkan/${id}`);
}
export async function apiSaveBill(body) {
  await post('/api/bills/save', body);
}
export async function apiBillBayar(id, method) {
  await post(`/api/bills/bayar/${id}`, { method: method || 'manual' });
}
export const apiBillsGenerateRecurring = () => post('/api/bills/generate-recurring');
export async function apiSaveAppSettings(settings) {
  await post('/api/app-settings', settings);
}
export async function apiAppSettingsAddAdmin(email, password) {
  await post('/api/app-settings/admin-users', { email, password });
}
export async function apiSaveOdpPop(body) {
  const d = await post('/api/odp-pop/save', body);
  return d.id;
}
export async function apiDeleteOdpPop(id) {
  await post(`/api/odp-pop/delete/${id}`);
}
export async function apiSaveSupportTicket(body) {
  await post('/api/support-tickets/save', body);
}
export async function apiCloseSupportTicket(id) {
  await post(`/api/support-tickets/close/${id}`);
}
export async function apiVouchersGenerate(body) {
  await post('/api/vouchers/generate', body);
}
export async function apiVpnProfileAdd(body) {
  await post('/api/vpn-radius/profiles/add', body);
}
export async function apiVpnProfileActivate(profileId) {
  await post('/api/vpn-radius/profiles/activate', { profile_id: profileId });
}
export async function apiVpnProfileDelete(id) {
  await post(`/api/vpn-radius/profiles/delete/${id}`);
}
export async function apiSystemToolsRestore(backupJson) {
  await post('/api/system-tools/restore', { backup_json: backupJson });
}
export async function apiSystemToolsImportUsers(importCsv) {
  return post('/api/system-tools/import-users', { import_csv: importCsv });
}
