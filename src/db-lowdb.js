/**
 * Database layer menggunakan lowdb (JSON file) - tanpa native dependency
 */
const path = require('path');
const fs = require('fs');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const file = process.env.DATABASE_PATH || path.join(dataDir, 'db.json');
const adapter = new JSONFile(file);
const defaultData = {
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
  _seq: {
    users: 1,
    routers: 1,
    packages: 1,
    customers: 1,
    bills: 1,
    payments: 1,
    vouchers: 1,
    support_tickets: 1,
    odp_pop: 1,
  },
};

let _db;
async function getDb() {
  if (_db) return _db;
  _db = new Low(adapter, defaultData);
  await _db.read();
  _db.data ||= defaultData;
  _db.data._seq ||= defaultData._seq;
  return _db;
}

function nextId(key) {
  const n = data._seq[key] || 1;
  data._seq[key] = n + 1;
  return n;
}

// Sync API untuk dipakai di route (kita baca sekali di startup)
function initSync() {
  let data = defaultData;
  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      data = defaultData;
    }
  }
  data.users = data.users || [];
  data.routers = data.routers || [];
  data.routers = data.routers.map((r) => ({
    ...r,
    integration_mode: r.integration_mode || 'api',
    vpn_profile_id: r.vpn_profile_id || null,
  }));
  data.packages = data.packages || [];
  data.customers = data.customers || [];
  data.bills = data.bills || [];
  data.payments = data.payments || [];
  data.vouchers = data.vouchers || [];
  data.app_settings = data.app_settings || {};
  data.activity_logs = data.activity_logs || [];
  data.support_tickets = data.support_tickets || [];
  data.odp_pop = data.odp_pop || [];
  data._seq = data._seq || defaultData._seq;
  data._seq.support_tickets = data._seq.support_tickets || 1;
  data._seq.odp_pop = data._seq.odp_pop || 1;
  return data;
}

function persist(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

let data = initSync();

function getData() {
  return data;
}

/** No-op untuk JSON DB; Supabase punya init() async. */
function init() {
  return Promise.resolve(data);
}

function save() {
  persist(data);
}

function normalizeImport(nextData) {
  const merged = {
    users: Array.isArray(nextData.users) ? nextData.users : [],
    routers: Array.isArray(nextData.routers) ? nextData.routers : [],
    packages: Array.isArray(nextData.packages) ? nextData.packages : [],
    customers: Array.isArray(nextData.customers) ? nextData.customers : [],
    bills: Array.isArray(nextData.bills) ? nextData.bills : [],
    payments: Array.isArray(nextData.payments) ? nextData.payments : [],
    vouchers: Array.isArray(nextData.vouchers) ? nextData.vouchers : [],
    app_settings: nextData.app_settings && typeof nextData.app_settings === 'object' ? nextData.app_settings : {},
    activity_logs: Array.isArray(nextData.activity_logs) ? nextData.activity_logs : [],
    support_tickets: Array.isArray(nextData.support_tickets) ? nextData.support_tickets : [],
    odp_pop: Array.isArray(nextData.odp_pop) ? nextData.odp_pop : [],
    _seq: nextData._seq || {},
  };
  const autoSeq = {
    users: (merged.users.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    routers: (merged.routers.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    packages: (merged.packages.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    customers: (merged.customers.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    bills: (merged.bills.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    payments: (merged.payments.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    vouchers: (merged.vouchers.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    support_tickets: (merged.support_tickets.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
    odp_pop: (merged.odp_pop.reduce((m, r) => Math.max(m, parseInt(r.id, 10) || 0), 0) || 0) + 1,
  };
  merged._seq = {
    users: Math.max(parseInt(merged._seq.users, 10) || 0, autoSeq.users),
    routers: Math.max(parseInt(merged._seq.routers, 10) || 0, autoSeq.routers),
    packages: Math.max(parseInt(merged._seq.packages, 10) || 0, autoSeq.packages),
    customers: Math.max(parseInt(merged._seq.customers, 10) || 0, autoSeq.customers),
    bills: Math.max(parseInt(merged._seq.bills, 10) || 0, autoSeq.bills),
    payments: Math.max(parseInt(merged._seq.payments, 10) || 0, autoSeq.payments),
    vouchers: Math.max(parseInt(merged._seq.vouchers, 10) || 0, autoSeq.vouchers),
    support_tickets: Math.max(parseInt(merged._seq.support_tickets, 10) || 0, autoSeq.support_tickets),
    odp_pop: Math.max(parseInt(merged._seq.odp_pop, 10) || 0, autoSeq.odp_pop),
  };
  return merged;
}

function replaceAllData(nextData) {
  if (!nextData || typeof nextData !== 'object') {
    throw new Error('Format data backup tidak valid.');
  }
  data = normalizeImport(nextData);
  save();
  return data;
}

// --- App Settings ---
function getAppSettings() {
  return data.app_settings || {};
}

function saveAppSettings(next) {
  data.app_settings = { ...(data.app_settings || {}), ...(next || {}) };
  save();
  return data.app_settings;
}

// --- Activity Logs ---
function addActivityLog(entry) {
  const row = {
    id: Date.now(),
    at: new Date().toISOString(),
    ...entry,
  };
  data.activity_logs.push(row);
  if (data.activity_logs.length > 5000) data.activity_logs = data.activity_logs.slice(-5000);
  save();
  return row;
}

function getActivityLogs(limit = 200) {
  return [...(data.activity_logs || [])]
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, Math.max(1, parseInt(limit, 10) || 200));
}

// --- Support Tickets ---
function getSupportTickets(status) {
  let list = data.support_tickets || [];
  if (status === 'open') list = list.filter((r) => r.status !== 'closed');
  if (status === 'closed') list = list.filter((r) => r.status === 'closed');
  return [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function getSupportTicketById(id) {
  return (data.support_tickets || []).find((r) => r.id === parseInt(id, 10)) || null;
}

function saveSupportTicket(row) {
  if (!row.subject) throw new Error('Subjek ticket wajib diisi.');
  if (row.id) {
    const i = data.support_tickets.findIndex((r) => r.id === parseInt(row.id, 10));
    if (i >= 0) {
      data.support_tickets[i] = {
        ...data.support_tickets[i],
        subject: row.subject,
        customer_id: row.customer_id ? parseInt(row.customer_id, 10) : null,
        priority: row.priority || 'normal',
        status: row.status || 'open',
        description: row.description || '',
        updated_at: new Date().toISOString(),
      };
      if (data.support_tickets[i].status === 'closed' && !data.support_tickets[i].closed_at) {
        data.support_tickets[i].closed_at = new Date().toISOString();
      }
      if (data.support_tickets[i].status !== 'closed') data.support_tickets[i].closed_at = null;
      save();
      return data.support_tickets[i];
    }
  }
  const item = {
    id: nextId('support_tickets'),
    subject: row.subject,
    customer_id: row.customer_id ? parseInt(row.customer_id, 10) : null,
    priority: row.priority || 'normal',
    status: row.status || 'open',
    description: row.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    closed_at: row.status === 'closed' ? new Date().toISOString() : null,
  };
  data.support_tickets.push(item);
  save();
  return item;
}

function closeSupportTicket(id) {
  const t = getSupportTicketById(id);
  if (!t) return null;
  t.status = 'closed';
  t.closed_at = new Date().toISOString();
  t.updated_at = t.closed_at;
  save();
  return t;
}

// --- ODP / POP ---
function getOdpPop() {
  return [...(data.odp_pop || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getOdpPopById(id) {
  return (data.odp_pop || []).find((r) => r.id === parseInt(id, 10)) || null;
}

function saveOdpPop(row) {
  if (!row.name) throw new Error('Nama ODP/POP wajib diisi.');
  if (row.id) {
    const i = data.odp_pop.findIndex((r) => r.id === parseInt(row.id, 10));
    if (i >= 0) {
      data.odp_pop[i] = {
        ...data.odp_pop[i],
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
      save();
      return data.odp_pop[i];
    }
  }
  const item = {
    id: nextId('odp_pop'),
    name: row.name,
    type: row.type || 'odp',
    area: row.area || '',
    address: row.address || '',
    latitude: row.latitude || '',
    longitude: row.longitude || '',
    note: row.note || '',
    status: row.status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  data.odp_pop.push(item);
  save();
  return item;
}

function deleteOdpPop(id) {
  data.odp_pop = (data.odp_pop || []).filter((r) => r.id !== parseInt(id, 10));
  save();
}

// --- Users ---
function getUserById(id) {
  return data.users.find((u) => u.id === parseInt(id, 10));
}

function getUserByUsername(username) {
  return data.users.find((u) => u.username === username);
}

// --- Routers ---
function getRouters() {
  return data.routers.filter((r) => r.is_active !== 0).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getAllRouters() {
  return [...data.routers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getRouterById(id) {
  return data.routers.find((r) => r.id === parseInt(id, 10));
}

function saveRouter(row) {
  if (row.id) {
    const i = data.routers.findIndex((r) => r.id === row.id);
    if (i >= 0) {
      const r = data.routers[i];
      data.routers[i] = {
        ...r,
        name: row.name,
        host: row.host,
        port: row.port || 8728,
        username: row.username,
        password: row.password !== undefined && row.password !== '' ? row.password : r.password,
        is_ssl: row.is_ssl ? 1 : 0,
        integration_mode: row.integration_mode || r.integration_mode || 'api',
        use_vpn: row.use_vpn ? 1 : 0,
        vpn_ip: row.vpn_ip || null,
        vpn_profile_id: row.vpn_profile_id !== undefined ? row.vpn_profile_id : (r.vpn_profile_id || null),
        id: r.id,
      };
      save();
      return Promise.resolve(data.routers[i]);
    }
  }
  const id = nextId('routers');
  data.routers.push({
    id,
    name: row.name,
    host: row.host,
    port: row.port || 8728,
    username: row.username,
    password: row.password,
    is_ssl: row.is_ssl ? 1 : 0,
    integration_mode: row.integration_mode || 'api',
    is_active: 1,
    use_vpn: row.use_vpn ? 1 : 0,
    vpn_ip: row.vpn_ip || null,
    vpn_profile_id: row.vpn_profile_id || null,
    created_at: new Date().toISOString(),
  });
  save();
  return Promise.resolve(data.routers[data.routers.length - 1]);
}

function deleteRouter(id) {
  data.routers = data.routers.filter((r) => r.id !== parseInt(id, 10));
  save();
  return Promise.resolve();
}

// --- Packages ---
function getPackages() {
  return [...data.packages].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function getPackageById(id) {
  return data.packages.find((p) => p.id === parseInt(id, 10));
}

function savePackage(row) {
  if (row.id) {
    const i = data.packages.findIndex((p) => p.id === row.id);
    if (i >= 0) {
      data.packages[i] = { ...data.packages[i], ...row, id: data.packages[i].id };
      save();
      return Promise.resolve(data.packages[i]);
    }
  }
  const id = nextId('packages');
  data.packages.push({
    id,
    name: row.name,
    type: row.type || 'pppoe',
    price_monthly: parseFloat(row.price_monthly) || 0,
    speed_limit: row.speed_limit || null,
    validity_days: row.validity_days ? parseInt(row.validity_days, 10) : null,
    created_at: new Date().toISOString(),
  });
  save();
  return Promise.resolve(data.packages[data.packages.length - 1]);
}

function deletePackage(id) {
  data.packages = data.packages.filter((p) => p.id !== parseInt(id, 10));
  save();
  return Promise.resolve();
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
  return data.customers.find((c) => c.id === parseInt(id, 10));
}

function saveCustomer(row) {
  const routerId = parseInt(row.router_id, 10);
  const packageId = row.package_id ? parseInt(row.package_id, 10) : null;
  const dup = data.customers.find(
    (c) => c.router_id === routerId && c.username === row.username && c.id !== parseInt(row.id, 10)
  );
  if (dup) throw new Error('UNIQUE');

  if (row.id) {
    const i = data.customers.findIndex((c) => c.id === parseInt(row.id, 10));
    if (i >= 0) {
      data.customers[i] = {
        ...data.customers[i],
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
      save();
      return Promise.resolve(data.customers[i]);
    }
  }
  const id = nextId('customers');
  data.customers.push({
    id,
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
    created_at: new Date().toISOString(),
  });
  save();
  return Promise.resolve(data.customers[data.customers.length - 1]);
}

function updateCustomerStatus(id, status) {
  const c = getCustomerById(id);
  if (!c) return Promise.resolve();
  c.status = status;
  save();
  return Promise.resolve();
}

function getCustomerByUsernamePassword(username, password) {
  return data.customers.find((c) => c.username === username && c.password === password) || null;
}

// --- Bills ---
function getBillById(id) {
  return data.bills.find((b) => b.id === parseInt(id, 10));
}

function getBillsByCustomerId(customerId) {
  return data.bills
    .filter((b) => b.customer_id === parseInt(customerId, 10))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

// --- Payments (for reports) ---
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
    (b) => b.customer_id === parseInt(customerId, 10) && b.period_start === periodStart
  );
}

function getBills() {
  return data.bills
    .map((b) => {
      const c = getCustomerById(b.customer_id);
      return {
        ...b,
        customer_name: c ? c.name : null,
        username: c ? c.username : null,
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 200);
}

function addBill(row) {
  const id = nextId('bills');
  const bill = {
    id,
    customer_id: parseInt(row.customer_id, 10),
    period_start: row.period_start,
    period_end: row.period_end,
    amount: parseFloat(row.amount) || 0,
    status: 'unpaid',
    due_date: row.due_date || null,
    paid_at: null,
    created_at: new Date().toISOString(),
  };
  data.bills.push(bill);
  save();
  return Promise.resolve(bill);
}

function payBill(id, method) {
  const bill = data.bills.find((b) => b.id === parseInt(id, 10));
  if (!bill) return null;
  bill.status = 'paid';
  bill.paid_at = new Date().toISOString();
  data.payments.push({
    id: nextId('payments'),
    bill_id: bill.id,
    customer_id: bill.customer_id,
    amount: bill.amount,
    method: method || 'manual',
    reference: null,
    paid_at: bill.paid_at,
  });
  save();
  return Promise.resolve(bill);
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

function addVouchers(rows) {
  rows.forEach((row) => {
    const id = nextId('vouchers');
    data.vouchers.push({
      id,
      router_id: parseInt(row.router_id, 10),
      package_id: row.package_id ? parseInt(row.package_id, 10) : null,
      code: row.code,
      duration_minutes: row.duration_minutes ? parseInt(row.duration_minutes, 10) : null,
      used: 0,
      created_at: new Date().toISOString(),
    });
  });
  save();
  return Promise.resolve();
}

// --- Stats ---
function getStats() {
  const routers = data.routers.filter((r) => r.is_active !== 0).length;
  const customers = data.customers.length;
  const active = data.customers.filter((c) => c.status === 'active').length;
  const unpaidBills = data.bills.filter((b) => b.status === 'unpaid');
  const unpaid = unpaidBills.length;
  const totalUnpaid = unpaidBills.reduce((s, b) => s + (b.amount || 0), 0);
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
  getStats,
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
  replaceAllData,
  prepare,
};

module.exports = db;
