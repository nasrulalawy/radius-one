/**
 * Database layer menggunakan Supabase (PostgreSQL)
 * API sama dengan db.js agar route tidak perlu diubah banyak.
 * Baca: sync dari cache. Tulis: async (harus await di route).
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_KEY (atau SUPABASE_ANON_KEY) harus diset di .env');

const supabase = createClient(url, key);

// Cache in-memory (diisi oleh init())
const data = {
  users: [],
  routers: [],
  packages: [],
  customers: [],
  bills: [],
  payments: [],
  vouchers: [],
  app_settings: {},
  activity_logs: [],
  support_tickets: [],
  odp_pop: [],
};

function toNum(id) {
  if (id == null) return null;
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? null : n;
}

/** Load semua tabel dari Supabase ke cache. Panggil sekali di startup. */
async function init() {
  const [u, r, p, c, b, pay, v, s, logs, t, o] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('routers').select('*'),
    supabase.from('packages').select('*'),
    supabase.from('customers').select('*'),
    supabase.from('bills').select('*'),
    supabase.from('payments').select('*'),
    supabase.from('vouchers').select('*'),
    supabase.from('app_settings').select('*'),
    supabase.from('activity_logs').select('*').order('at', { ascending: false }).limit(5000),
    supabase.from('support_tickets').select('*'),
    supabase.from('odp_pop').select('*'),
  ]);
  if (u.error) throw new Error('Supabase users: ' + u.error.message);
  if (r.error) throw new Error('Supabase routers: ' + r.error.message);
  if (p.error) throw new Error('Supabase packages: ' + p.error.message);
  if (c.error) throw new Error('Supabase customers: ' + c.error.message);
  if (b.error) throw new Error('Supabase bills: ' + b.error.message);
  if (pay.error) throw new Error('Supabase payments: ' + pay.error.message);
  if (v.error) throw new Error('Supabase vouchers: ' + v.error.message);
  if (s.error) throw new Error('Supabase app_settings: ' + s.error.message);
  if (logs.error) throw new Error('Supabase activity_logs: ' + logs.error.message);
  if (t.error) throw new Error('Supabase support_tickets: ' + t.error.message);
  if (o.error) throw new Error('Supabase odp_pop: ' + o.error.message);
  data.users = u.data || [];
  data.routers = (r.data || []).map((row) => ({
    ...row,
    integration_mode: row.integration_mode || 'api',
    vpn_profile_id: row.vpn_profile_id || null,
  }));
  data.packages = p.data || [];
  data.customers = c.data || [];
  data.bills = b.data || [];
  data.payments = pay.data || [];
  data.vouchers = v.data || [];
  data.app_settings = (s.data || []).reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  data.activity_logs = logs.data || [];
  data.support_tickets = t.data || [];
  data.odp_pop = o.data || [];
  return data;
}

function getData() {
  return data;
}

// --- App Settings ---
function getAppSettings() {
  return data.app_settings || {};
}

async function saveAppSettings(next) {
  const merged = { ...(data.app_settings || {}), ...(next || {}) };
  const rows = Object.entries(merged).map(([key, value]) => ({ key, value: value == null ? '' : String(value) }));
  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  data.app_settings = merged;
  return data.app_settings;
}

// --- Activity Logs ---
async function addActivityLog(entry) {
  const payload = {
    at: new Date().toISOString(),
    user_id: entry.user_id || null,
    method: entry.method || null,
    path: entry.path || null,
    status: entry.status || null,
    ip: entry.ip || null,
    payload: entry.payload || {},
  };
  const { data: inserted, error } = await supabase.from('activity_logs').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.activity_logs.unshift(inserted);
  if (data.activity_logs.length > 5000) data.activity_logs = data.activity_logs.slice(0, 5000);
  return inserted;
}

function getActivityLogs(limit = 200) {
  return [...(data.activity_logs || [])]
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, Math.max(1, parseInt(limit, 10) || 200));
}

// --- Users (read-only dari cache) ---
function getUserById(id) {
  return data.users.find((u) => toNum(u.id) === toNum(id)) || null;
}

function getUserByUsername(username) {
  return data.users.find((u) => u.username === username) || null;
}

// --- Routers ---
function getRouters() {
  return data.routers.filter((r) => r.is_active !== 0).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getAllRouters() {
  return [...data.routers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getRouterById(id) {
  return data.routers.find((r) => toNum(r.id) === toNum(id)) || null;
}

async function saveRouter(row) {
  const payload = {
    name: row.name,
    host: row.host,
    port: row.port || 8728,
    username: row.username,
    is_ssl: row.is_ssl ? 1 : 0,
    integration_mode: row.integration_mode || 'api',
    use_vpn: row.use_vpn ? 1 : 0,
    vpn_ip: row.vpn_ip || null,
  };
  if (row.vpn_profile_id !== undefined) payload.vpn_profile_id = row.vpn_profile_id || null;
  if (row.password !== undefined && row.password !== '') payload.password = row.password;

  if (row.id) {
    const { data: updated, error } = await supabase.from('routers').update(payload).eq('id', toNum(row.id)).select().single();
    if (error) throw new Error(error.message);
    const i = data.routers.findIndex((r) => toNum(r.id) === toNum(row.id));
    if (i >= 0) data.routers[i] = { ...data.routers[i], ...updated };
    return data.routers[i] || updated;
  }
  const { data: inserted, error } = await supabase.from('routers').insert({ ...payload, is_active: 1 }).select().single();
  if (error) throw new Error(error.message);
  data.routers.push(inserted);
  return inserted;
}

async function deleteRouter(id) {
  const { error } = await supabase.from('routers').delete().eq('id', toNum(id));
  if (error) throw new Error(error.message);
  data.routers = data.routers.filter((r) => toNum(r.id) !== toNum(id));
}

// --- Packages ---
function getPackages() {
  return [...data.packages].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getPackageById(id) {
  return data.packages.find((p) => toNum(p.id) === toNum(id)) || null;
}

async function savePackage(row) {
  const payload = {
    name: row.name,
    type: row.type || 'pppoe',
    price_monthly: parseFloat(row.price_monthly) || 0,
    speed_limit: row.speed_limit || null,
    validity_days: row.validity_days ? parseInt(row.validity_days, 10) : null,
  };
  if (row.id) {
    const { data: updated, error } = await supabase.from('packages').update(payload).eq('id', toNum(row.id)).select().single();
    if (error) throw new Error(error.message);
    const i = data.packages.findIndex((p) => toNum(p.id) === toNum(row.id));
    if (i >= 0) data.packages[i] = { ...data.packages[i], ...updated };
    return data.packages[i] || updated;
  }
  const { data: inserted, error } = await supabase.from('packages').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.packages.push(inserted);
  return inserted;
}

async function deletePackage(id) {
  const { error } = await supabase.from('packages').delete().eq('id', toNum(id));
  if (error) throw new Error(error.message);
  data.packages = data.packages.filter((p) => toNum(p.id) !== toNum(id));
}

// --- Customers ---
function getCustomers() {
  return data.customers.map((c) => {
    const r = getRouterById(c.router_id);
    const p = getPackageById(c.package_id);
    return { ...c, router_name: r ? r.name : null, package_name: p ? p.name : null };
  }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getCustomerById(id) {
  return data.customers.find((c) => toNum(c.id) === toNum(id)) || null;
}

async function saveCustomer(row) {
  const routerId = toNum(row.router_id);
  const packageId = row.package_id ? toNum(row.package_id) : null;
  const dup = data.customers.find(
    (c) => toNum(c.router_id) === routerId && c.username === row.username && toNum(c.id) !== toNum(row.id)
  );
  if (dup) throw new Error('UNIQUE');

  const payload = {
    router_id: routerId,
    package_id: packageId,
    name: row.name,
    username: row.username,
    password: row.password,
    type: row.type || 'pppoe',
    status: row.status || 'active',
    address: row.address || null,
    phone: row.phone || null,
    email: row.email || null,
  };

  if (row.id) {
    const { data: updated, error } = await supabase.from('customers').update(payload).eq('id', toNum(row.id)).select().single();
    if (error) throw new Error(error.message);
    const i = data.customers.findIndex((c) => toNum(c.id) === toNum(row.id));
    if (i >= 0) data.customers[i] = { ...data.customers[i], ...updated };
    return data.customers[i] || updated;
  }
  const { data: inserted, error } = await supabase.from('customers').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.customers.push(inserted);
  return inserted;
}

async function updateCustomerStatus(id, status) {
  const { error } = await supabase.from('customers').update({ status }).eq('id', toNum(id));
  if (error) throw new Error(error.message);
  const c = data.customers.find((x) => toNum(x.id) === toNum(id));
  if (c) c.status = status;
}

function getCustomerByUsernamePassword(username, password) {
  return data.customers.find((c) => c.username === username && c.password === password) || null;
}

// --- Bills ---
function getBillById(id) {
  return data.bills.find((b) => toNum(b.id) === toNum(id)) || null;
}

function getBillsByCustomerId(customerId) {
  return data.bills
    .filter((b) => toNum(b.customer_id) === toNum(customerId))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function getPayments(fromDate, toDate) {
  let list = data.payments.map((p) => {
    const c = getCustomerById(p.customer_id);
    return { ...p, customer_name: c ? c.name : null };
  });
  if (fromDate) list = list.filter((p) => p.paid_at && p.paid_at >= fromDate);
  if (toDate) list = list.filter((p) => p.paid_at && p.paid_at.slice(0, 10) <= toDate);
  return list.sort((a, b) => new Date(b.paid_at || 0) - new Date(a.paid_at || 0));
}

function hasBillForPeriod(customerId, periodStart) {
  return data.bills.some(
    (b) => toNum(b.customer_id) === toNum(customerId) && b.period_start === periodStart
  );
}

function getBills() {
  return data.bills
    .map((b) => {
      const c = getCustomerById(b.customer_id);
      return { ...b, customer_name: c ? c.name : null, username: c ? c.username : null };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 200);
}

async function addBill(row) {
  const payload = {
    customer_id: toNum(row.customer_id),
    period_start: row.period_start,
    period_end: row.period_end,
    amount: parseFloat(row.amount) || 0,
    status: 'unpaid',
    due_date: row.due_date || null,
  };
  const { data: inserted, error } = await supabase.from('bills').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.bills.push(inserted);
  return inserted;
}

async function payBill(id, method) {
  const bill = data.bills.find((b) => toNum(b.id) === toNum(id));
  if (!bill) return null;
  const paidAt = new Date().toISOString();
  const { data: paymentRow, error: payErr } = await supabase.from('payments').insert({
    bill_id: toNum(bill.id),
    customer_id: toNum(bill.customer_id),
    amount: bill.amount,
    method: method || 'manual',
    reference: null,
    paid_at: paidAt,
  }).select().single();
  if (payErr) throw new Error(payErr.message);
  data.payments.push(paymentRow);

  const { error: billErr } = await supabase.from('bills').update({ status: 'paid', paid_at: paidAt }).eq('id', toNum(id));
  if (billErr) throw new Error(billErr.message);
  bill.status = 'paid';
  bill.paid_at = paidAt;
  return bill;
}

// --- Vouchers ---
function getVouchers() {
  return data.vouchers
    .map((v) => {
      const r = getRouterById(v.router_id);
      const p = getPackageById(v.package_id);
      return { ...v, router_name: r ? r.name : null, package_name: p ? p.name : null };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 500);
}

async function addVouchers(rows) {
  const toInsert = rows.map((row) => ({
    router_id: toNum(row.router_id),
    package_id: row.package_id ? toNum(row.package_id) : null,
    code: row.code,
    duration_minutes: row.duration_minutes ? parseInt(row.duration_minutes, 10) : null,
  }));
  const { data: inserted, error } = await supabase.from('vouchers').insert(toInsert).select();
  if (error) throw new Error(error.message);
  if (Array.isArray(inserted)) data.vouchers.push(...inserted);
}

// --- Support Tickets ---
function getSupportTickets(status) {
  let list = data.support_tickets || [];
  if (status === 'open') list = list.filter((r) => r.status !== 'closed');
  if (status === 'closed') list = list.filter((r) => r.status === 'closed');
  return [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function getSupportTicketById(id) {
  return (data.support_tickets || []).find((r) => toNum(r.id) === toNum(id)) || null;
}

async function saveSupportTicket(row) {
  if (!row.subject) throw new Error('Subjek ticket wajib diisi.');
  const payload = {
    subject: row.subject,
    customer_id: row.customer_id ? toNum(row.customer_id) : null,
    priority: row.priority || 'normal',
    status: row.status || 'open',
    description: row.description || '',
    closed_at: row.status === 'closed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (row.id) {
    const { data: updated, error } = await supabase.from('support_tickets').update(payload).eq('id', toNum(row.id)).select().single();
    if (error) throw new Error(error.message);
    const i = data.support_tickets.findIndex((r) => toNum(r.id) === toNum(row.id));
    if (i >= 0) data.support_tickets[i] = { ...data.support_tickets[i], ...updated };
    return data.support_tickets[i] || updated;
  }
  const { data: inserted, error } = await supabase.from('support_tickets').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.support_tickets.push(inserted);
  return inserted;
}

async function closeSupportTicket(id) {
  const payload = {
    status: 'closed',
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: updated, error } = await supabase.from('support_tickets').update(payload).eq('id', toNum(id)).select().single();
  if (error) throw new Error(error.message);
  const i = data.support_tickets.findIndex((r) => toNum(r.id) === toNum(id));
  if (i >= 0) data.support_tickets[i] = { ...data.support_tickets[i], ...updated };
  return data.support_tickets[i] || updated;
}

// --- ODP / POP ---
function getOdpPop() {
  return [...(data.odp_pop || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getOdpPopById(id) {
  return (data.odp_pop || []).find((r) => toNum(r.id) === toNum(id)) || null;
}

async function saveOdpPop(row) {
  if (!row.name) throw new Error('Nama ODP/POP wajib diisi.');
  const payload = {
    name: row.name,
    type: row.type || 'odp',
    area: row.area || '',
    address: row.address || '',
    latitude: row.latitude || '',
    longitude: row.longitude || '',
    note: row.note || '',
    status: row.status || 'active',
    updated_at: new Date().toISOString(),
  };
  if (row.id) {
    const { data: updated, error } = await supabase.from('odp_pop').update(payload).eq('id', toNum(row.id)).select().single();
    if (error) throw new Error(error.message);
    const i = data.odp_pop.findIndex((r) => toNum(r.id) === toNum(row.id));
    if (i >= 0) data.odp_pop[i] = { ...data.odp_pop[i], ...updated };
    return data.odp_pop[i] || updated;
  }
  const { data: inserted, error } = await supabase.from('odp_pop').insert(payload).select().single();
  if (error) throw new Error(error.message);
  data.odp_pop.push(inserted);
  return inserted;
}

async function deleteOdpPop(id) {
  const { error } = await supabase.from('odp_pop').delete().eq('id', toNum(id));
  if (error) throw new Error(error.message);
  data.odp_pop = data.odp_pop.filter((r) => toNum(r.id) !== toNum(id));
}

// --- Stats ---
function getStats() {
  const routers = data.routers.filter((r) => r.is_active !== 0).length;
  const customers = data.customers.length;
  const active = data.customers.filter((c) => c.status === 'active').length;
  const unpaidBills = data.bills.filter((b) => b.status === 'unpaid');
  const unpaid = unpaidBills.length;
  const totalUnpaid = unpaidBills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  return { routers, customers, active, unpaid, totalUnpaid };
}

// Compat: prepare().get(id) / .all() untuk auth & loadUser
function prepare(sql) {
  const match = sql.match(/SELECT.*FROM\s+(\w+).*WHERE\s+id\s*=\s*\?/i) ||
    sql.match(/SELECT.*FROM\s+(\w+).*WHERE\s+username\s*=\s*\?/i);
  return {
    get(...args) {
      const table = match && match[1];
      if (table === 'users' && args[0] && typeof args[0] === 'number') return getUserById(args[0]);
      if (table === 'users' && args[0] && typeof args[0] === 'string') return getUserByUsername(args[0]);
      if (table === 'routers' && args[0]) return getRouterById(args[0]);
      if (table === 'packages' && args[0]) return getPackageById(args[0]);
      if (table === 'customers' && args[0]) return getCustomerById(args[0]);
      return null;
    },
    all() {
      if (sql.includes('routers')) return getAllRouters();
      if (sql.includes('packages')) return getPackages();
      if (sql.includes('customers') && sql.includes('router_name')) return getCustomers();
      if (sql.includes('bills') && sql.includes('customer_name')) return getBills();
      if (sql.includes('vouchers') && sql.includes('router_name')) return getVouchers();
      if (sql.includes('customers') && sql.includes('status')) return data.customers.filter((c) => c.status === 'active');
      return [];
    },
    run() {},
  };
}

function normalizeImport(nextData) {
  return {
    users: Array.isArray(nextData.users) ? nextData.users : [],
    routers: Array.isArray(nextData.routers) ? nextData.routers : [],
    packages: Array.isArray(nextData.packages) ? nextData.packages : [],
    customers: Array.isArray(nextData.customers) ? nextData.customers : [],
    bills: Array.isArray(nextData.bills) ? nextData.bills : [],
    payments: Array.isArray(nextData.payments) ? nextData.payments : [],
    vouchers: Array.isArray(nextData.vouchers) ? nextData.vouchers : [],
    support_tickets: Array.isArray(nextData.support_tickets) ? nextData.support_tickets : [],
    odp_pop: Array.isArray(nextData.odp_pop) ? nextData.odp_pop : [],
    activity_logs: Array.isArray(nextData.activity_logs) ? nextData.activity_logs : [],
    app_settings: nextData.app_settings && typeof nextData.app_settings === 'object' ? nextData.app_settings : {},
  };
}

async function replaceRows(table, rows, hasId = true) {
  let clear;
  if (hasId) clear = await supabase.from(table).delete().gte('id', 0);
  else clear = await supabase.from(table).delete().neq('key', '__never__');
  if (clear.error) throw new Error(`${table} clear: ${clear.error.message}`);
  if (!rows.length) return;
  const insert = await supabase.from(table).insert(rows);
  if (insert.error) throw new Error(`${table} insert: ${insert.error.message}`);
}

async function replaceAllData(nextData) {
  if (!nextData || typeof nextData !== 'object') {
    throw new Error('Format data backup tidak valid.');
  }
  const n = normalizeImport(nextData);
  await replaceRows('payments', []);
  await replaceRows('bills', []);
  await replaceRows('customers', []);
  await replaceRows('vouchers', []);
  await replaceRows('routers', []);
  await replaceRows('packages', []);
  await replaceRows('users', []);
  await replaceRows('support_tickets', []);
  await replaceRows('odp_pop', []);
  await replaceRows('activity_logs', []);
  await replaceRows('app_settings', [], false);

  await replaceRows('users', n.users);
  await replaceRows('routers', n.routers);
  await replaceRows('packages', n.packages);
  await replaceRows('customers', n.customers);
  await replaceRows('bills', n.bills);
  await replaceRows('payments', n.payments);
  await replaceRows('vouchers', n.vouchers);
  await replaceRows('support_tickets', n.support_tickets);
  await replaceRows('odp_pop', n.odp_pop);
  await replaceRows('activity_logs', n.activity_logs);
  await replaceRows(
    'app_settings',
    Object.entries(n.app_settings).map(([key, value]) => ({ key, value: value == null ? '' : String(value) })),
    false
  );
  await init();
  return data;
}

const db = {
  init,
  getData,
  getUserById,
  getUserByUsername,
  getRouters,
  getAllRouters,
  getRouterById,
  saveRouter,
  deleteRouter,
  getPackages,
  getPackageById,
  savePackage,
  deletePackage,
  getCustomers,
  getCustomerById,
  getCustomerByUsernamePassword,
  saveCustomer,
  updateCustomerStatus,
  getBills,
  getBillById,
  getBillsByCustomerId,
  getPayments,
  hasBillForPeriod,
  addBill,
  payBill,
  getVouchers,
  addVouchers,
  getAppSettings,
  saveAppSettings,
  addActivityLog,
  getActivityLogs,
  getSupportTickets,
  getSupportTicketById,
  saveSupportTicket,
  closeSupportTicket,
  getOdpPop,
  getOdpPopById,
  saveOdpPop,
  deleteOdpPop,
  getStats,
  replaceAllData,
  prepare,
};

module.exports = db;
