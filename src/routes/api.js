/**
 * REST API for Vite/React frontend (JSON only).
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, loadUser, login } = require('../middleware/auth');
const provisioning = require('../services/provisioning');
const appConfig = require('../services/appConfig');
const supportTickets = require('../services/supportTickets');
const odpPop = require('../services/odpPop');
const supabaseAuth = require('../services/supabaseAuth');
const vpnProfiles = require('../services/vpnProfiles');
const activityLog = require('../services/activityLog');

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(loadUser);

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib' });
  }
  try {
    const user = await login(username, password);
    if (!user) return res.status(401).json({ error: 'Username atau password salah' });
    req.session.userId = user.id;
    if (user.access_token) {
      req.session.supabaseAuth = { access_token: user.access_token };
    }
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Session error' });
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Login gagal' });
  }
});

router.post('/logout', (req, res) => {
  req.session.userId = null;
  req.session.supabaseAuth = null;
  req.session.save(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'Unauthorized' });
  const u = db.getUserById(req.session.userId);
  if (!u) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: { id: u.id, username: u.username, role: u.role } });
});

router.get('/dashboard', requireAuth, (req, res) => {
  const stats = db.getStats();
  const payments = db.getPayments();
  const bills = db.getBills();
  const customers = db.getCustomers();
  const packages = db.getPackages();
  const vouchers = db.getVouchers ? db.getVouchers() : [];

  const now = new Date();
  const revenueByMonth = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const monthPayments = (payments || []).filter((p) => {
      const paid = (p.paid_at || '').toString().slice(0, 7);
      return paid === monthKey;
    });
    const total = monthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    revenueByMonth.push({
      label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      value: total,
      monthKey,
    });
  }

  const customerByType = { hotspot: 0, pppoe: 0 };
  (customers || []).forEach((c) => {
    const t = (c.type || '').toLowerCase();
    if (t === 'hotspot') customerByType.hotspot++;
    else customerByType.pppoe++;
  });

  const billsByStatus = { paid: 0, unpaid: 0 };
  (bills || []).forEach((b) => {
    if (b.status === 'paid') billsByStatus.paid++;
    else billsByStatus.unpaid++;
  });

  const recentPayments = (payments || []).slice(0, 10);

  res.json({
    stats,
    revenueByMonth,
    customerByType,
    billsByStatus,
    recentPayments,
    packagesCount: (packages || []).length,
    vouchersTotal: (vouchers || []).length,
    vouchersUsed: (vouchers || []).filter((v) => parseInt(v.used, 10) === 1).length,
  });
});

router.get('/customers', requireAuth, (req, res) => {
  const list = db.getCustomers();
  res.json({ customers: list });
});

router.get('/packages', requireAuth, (req, res) => {
  const list = db.getPackages();
  res.json({ packages: list });
});

router.get('/routers', requireAuth, (req, res) => {
  const list = db.getAllRouters();
  res.json({ routers: list });
});

router.get('/bills', requireAuth, (req, res) => {
  const list = db.getBills();
  const unpaidOnly = req.query.unpaid === '1' || req.query.unpaid === 'true';
  const bills = unpaidOnly ? list.filter((b) => b.status === 'unpaid') : list;
  res.json({ bills });
});

router.get('/reports/payments', requireAuth, (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const payments = db.getPayments(from ? from + 'T00:00:00.000Z' : undefined, to || undefined);
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  res.json({ payments, total, from, to });
});

router.get('/reports/statistics', requireAuth, (req, res) => {
  const stats = db.getStats();
  const bills = db.getBills();
  const paid = bills.filter((b) => b.status === 'paid');
  const unpaid = bills.filter((b) => b.status === 'unpaid');
  res.json({
    stats,
    totalPaid: paid.reduce((s, b) => s + (b.amount || 0), 0),
    totalUnpaid: unpaid.reduce((s, b) => s + (b.amount || 0), 0),
    paidCount: paid.length,
    unpaidCount: unpaid.length,
  });
});

// ---- Users Session ----
router.get('/users-session', requireAuth, async (req, res) => {
  const customers = db.getCustomers();
  const vouchers = db.getData().vouchers || [];
  const routers = db.getAllRouters();
  const perRouterLive = await Promise.all(routers.map(async (r) => {
    try {
      const live = await provisioning.getLiveSessions(r);
      return { router: r, ...live, ok: true };
    } catch (e) {
      return { router: r, pppActive: 0, hotspotActive: 0, ok: false, error: e.message };
    }
  }));
  const pppUsers = customers.filter((c) => c.type === 'pppoe');
  const hotspotUsers = customers.filter((c) => c.type === 'hotspot');
  res.json({
    stats: {
      pppUsers: pppUsers.length,
      hotspotUsers: hotspotUsers.length,
      activePpp: pppUsers.filter((c) => c.status === 'active').length,
      activeHotspot: hotspotUsers.filter((c) => c.status === 'active').length,
      livePpp: perRouterLive.reduce((s, r) => s + (r.pppActive || 0), 0),
      liveHotspot: perRouterLive.reduce((s, r) => s + (r.hotspotActive || 0), 0),
      totalVouchers: vouchers.length,
      usedVouchers: vouchers.filter((v) => parseInt(v.used, 10) === 1).length,
    },
    perRouterLive,
    hotspotUsers,
    pppUsers,
  });
});

// ---- App Settings ----
router.get('/app-settings', requireAuth, async (req, res) => {
  let adminUsers = [];
  try { adminUsers = await supabaseAuth.listAdminUsers(); } catch (e) {}
  res.json({ settings: appConfig.getSettings(), adminUsers });
});

router.post('/app-settings', requireAuth, async (req, res) => {
  try {
    await appConfig.saveSettings({
      app_name: (req.body.app_name || '').trim() || 'Radius One',
      company_name: (req.body.company_name || '').trim(),
      company_address: (req.body.company_address || '').trim(),
      company_phone: (req.body.company_phone || '').trim(),
      company_email: (req.body.company_email || '').trim(),
      currency_symbol: (req.body.currency_symbol || 'Rp').trim(),
      invoice_note: (req.body.invoice_note || '').trim(),
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/app-settings/admin-users', requireAuth, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib' });
  try {
    await supabaseAuth.createAdminUser(email, password);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Routers CRUD ----
router.get('/routers/status', requireAuth, async (req, res) => {
  const list = db.getAllRouters();
  const statuses = await Promise.all(
    list.map(async (r) => {
      try {
        await provisioning.testConnection(r);
        return { id: r.id, name: r.name, status: 'ok', message: null };
      } catch (e) {
        return { id: r.id, name: r.name, status: 'error', message: e.message || String(e) };
      }
    })
  );
  res.json({ statuses });
});

router.get('/routers/:id', requireAuth, (req, res) => {
  const r = db.getRouterById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Router tidak ditemukan' });
  res.json(r);
});

router.post('/routers/save', requireAuth, async (req, res) => {
  const { id, name, host, port, username, password, is_ssl, integration_mode, use_vpn, vpn_ip } = req.body;
  try {
    await db.saveRouter({
      id: id || null,
      name,
      host,
      port: port || 8728,
      username,
      password,
      is_ssl: is_ssl === '1' || is_ssl === true,
      integration_mode: integration_mode === 'radius' ? 'radius' : 'api',
      use_vpn: use_vpn === '1' || use_vpn === true,
      vpn_ip: (use_vpn === '1' || use_vpn === true) && vpn_ip ? vpn_ip.trim() : null,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/routers/delete/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteRouter(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/routers/test/:id', requireAuth, async (req, res) => {
  const r = db.getRouterById(req.params.id);
  if (!r) return res.status(404).json({ error: 'Router tidak ditemukan' });
  try {
    await provisioning.testConnection(r);
    res.json({ ok: true, name: r.name });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Packages CRUD ----
router.get('/packages/:id', requireAuth, (req, res) => {
  const p = db.getPackageById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Paket tidak ditemukan' });
  res.json(p);
});

router.post('/packages/save', requireAuth, async (req, res) => {
  const { id, name, type, price_monthly, speed_limit, validity_days } = req.body;
  try {
    await db.savePackage({ id: id || null, name, type, price_monthly, speed_limit, validity_days });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/packages/delete/:id', requireAuth, async (req, res) => {
  try {
    await db.deletePackage(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Customers CRUD ----
router.get('/customers/form-data', requireAuth, (req, res) => {
  res.json({ routers: db.getRouters(), packages: db.getPackages() });
});

router.get('/customers/:id', requireAuth, (req, res) => {
  const c = db.getCustomerById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  res.json(c);
});

router.post('/customers/save', requireAuth, async (req, res) => {
  const { id, router_id, package_id, name, username, password, type, status, address, phone } = req.body;
  const isNew = !id;
  try {
    const saved = await db.saveCustomer({
      id: id || null,
      router_id,
      package_id,
      name,
      username,
      password,
      type,
      status: status || 'active',
      address,
      phone,
    });
    if (isNew && saved) {
      const routerRow = db.getRouterById(router_id);
      if (routerRow) {
        try { await provisioning.syncNewCustomer(routerRow, saved); } catch (err) {
          return res.status(400).json({ error: err.message || 'Gagal sinkron user' });
        }
      }
    }
    res.json({ ok: true, id: saved?.id });
  } catch (e) {
    if (e.message === 'UNIQUE') return res.status(400).json({ error: 'Username sudah dipakai di router ini' });
    res.status(400).json({ error: e.message });
  }
});

router.post('/customers/isolir/:id', requireAuth, async (req, res) => {
  const c = db.getCustomerById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  const routerRow = db.getRouterById(c.router_id);
  if (routerRow) {
    try {
      await provisioning.isolateCustomer(routerRow, c);
    } catch (err) {
      return res.status(400).json({ error: 'Gagal isolir di router/RADIUS: ' + (err.message || String(err)) });
    }
  }
  await db.updateCustomerStatus(c.id, 'isolir');
  res.json({ ok: true });
});

router.post('/customers/aktifkan/:id', requireAuth, async (req, res) => {
  const c = db.getCustomerById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
  const routerRow = db.getRouterById(c.router_id);
  if (routerRow) {
    try {
      await provisioning.activateCustomer(routerRow, c);
    } catch (err) {
      return res.status(400).json({ error: 'Gagal aktifkan di router/RADIUS: ' + (err.message || String(err)) });
    }
  }
  await db.updateCustomerStatus(c.id, 'active');
  res.json({ ok: true });
});

// ---- Bills ----
router.get('/bills/form-data', requireAuth, (req, res) => {
  const customers = db.getData().customers.filter((c) => c.status === 'active');
  res.json({ customers });
});

router.post('/bills/save', requireAuth, async (req, res) => {
  const { customer_id, period_start, period_end, amount, due_date } = req.body;
  try {
    await db.addBill({ customer_id, period_start, period_end, amount, due_date });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/bills/bayar/:id', requireAuth, async (req, res) => {
  try {
    await db.payBill(req.params.id, req.body.method || 'manual');
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/bills/generate-recurring', requireAuth, async (req, res) => {
  const active = db.getData().customers.filter((c) => c.status === 'active');
  const now = new Date();
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const periodStart = nextStart.toISOString().slice(0, 10);
  const periodEnd = nextEnd.toISOString().slice(0, 10);
  const dueDate = new Date(nextStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let added = 0;
  for (const c of active) {
    if (db.hasBillForPeriod(c.id, periodStart)) continue;
    const lastBill = db.getBillsByCustomerId(c.id).find((b) => b.status === 'paid');
    const amount = lastBill ? lastBill.amount : (db.getPackageById(c.package_id)?.price_monthly || 0);
    if (amount <= 0) continue;
    try {
      await db.addBill({ customer_id: c.id, period_start, period_end, amount, due_date: dueDate });
      added++;
    } catch (e) {}
  }
  res.json({ ok: true, added });
});

// ---- ODP/POP ----
router.get('/odp-pop', requireAuth, async (req, res) => {
  const items = await odpPop.list();
  res.json({ items });
});

router.get('/odp-pop/:id', requireAuth, async (req, res) => {
  const item = await odpPop.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Tidak ditemukan' });
  res.json(item);
});

router.post('/odp-pop/save', requireAuth, async (req, res) => {
  try {
    const item = await odpPop.save(req.body);
    res.json({ ok: true, id: item?.id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/odp-pop/delete/:id', requireAuth, async (req, res) => {
  try {
    await odpPop.remove(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Support Tickets ----
router.get('/support-tickets', requireAuth, async (req, res) => {
  const status = req.query.status || 'all';
  const tickets = await supportTickets.list(status === 'all' ? undefined : status);
  const customers = db.getCustomers();
  const enriched = tickets.map((t) => ({
    ...t,
    customer_name: t.customer_id ? (customers.find((c) => parseInt(c.id, 10) === parseInt(t.customer_id, 10))?.name || null) : null,
  }));
  res.json({ tickets: enriched });
});

router.get('/support-tickets/:id', requireAuth, async (req, res) => {
  const t = await supportTickets.getById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket tidak ditemukan' });
  res.json(t);
});

router.post('/support-tickets/save', requireAuth, async (req, res) => {
  try {
    await supportTickets.save({
      id: req.body.id || null,
      subject: (req.body.subject || '').trim(),
      customer_id: req.body.customer_id || null,
      priority: req.body.priority || 'normal',
      status: req.body.status || 'open',
      description: (req.body.description || '').trim(),
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/support-tickets/close/:id', requireAuth, async (req, res) => {
  try {
    await supportTickets.close(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Vouchers ----
router.get('/vouchers', requireAuth, (req, res) => {
  res.json({ vouchers: db.getVouchers() });
});

router.get('/vouchers/generate-form', requireAuth, (req, res) => {
  res.json({
    routers: db.getRouters(),
    packages: db.getPackages().filter((p) => (p.type || '').toLowerCase() === 'hotspot'),
  });
});

router.post('/vouchers/generate', requireAuth, async (req, res) => {
  const { router_id, package_id, prefix, count, duration_minutes } = req.body;
  const n = Math.min(parseInt(count, 10) || 10, 100);
  const dur = parseInt(duration_minutes, 10) || 60;
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      router_id,
      package_id: package_id || null,
      code: (prefix || 'V') + Date.now().toString(36).toUpperCase() + i,
      duration_minutes: dur,
    });
  }
  try {
    const routerRow = router_id ? db.getRouterById(router_id) : null;
    if (routerRow) {
      await provisioning.syncVouchersToRouter(routerRow, rows);
    }
    await db.addVouchers(rows);
    res.json({ ok: true, count: n });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- VPN Radius ----
router.get('/vpn-radius', requireAuth, (req, res) => {
  const profiles = vpnProfiles.getProfiles();
  const activeProfile = vpnProfiles.getActiveProfile();
  res.json({ routers: db.getAllRouters(), profiles, activeProfile: activeProfile || null });
});

router.post('/vpn-radius/profiles/add', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.addProfile({
      name: req.body.name,
      server_endpoint: req.body.server_endpoint,
      server_public_key: req.body.server_public_key,
      vpn_network: req.body.vpn_network,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/vpn-radius/profiles/activate', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.setActiveProfile(req.body.profile_id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/vpn-radius/profiles/delete/:id', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.deleteProfile(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---- Software Logs ----
router.get('/software-logs', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  res.json({ logs: activityLog.readRecent(limit), limit });
});

// ---- System Tools ----
router.get('/system-tools/backup', requireAuth, (req, res) => {
  const payload = {
    exported_at: new Date().toISOString(),
    app_settings: appConfig.getSettings(),
    database: db.getData(),
  };
  res.json(payload);
});

router.post('/system-tools/restore', requireAuth, async (req, res) => {
  try {
    const raw = (req.body.backup_json || '').trim();
    if (!raw) throw new Error('Backup JSON wajib diisi.');
    const parsed = JSON.parse(raw);
    if (!parsed.database) throw new Error('Format backup tidak valid.');
    await db.replaceAllData({
      ...(parsed.database || {}),
      app_settings: parsed.app_settings || parsed.database?.app_settings || {},
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

function parseCsvLine(line) {
  const out = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && inQuotes && line[i + 1] === '"') { curr += '"'; i++; continue; }
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { out.push(curr.trim()); curr = ''; continue; }
    curr += ch;
  }
  out.push(curr.trim());
  return out;
}

router.post('/system-tools/import-users', requireAuth, async (req, res) => {
  const csv = (req.body.import_csv || '').trim();
  if (!csv) return res.status(400).json({ error: 'CSV tidak boleh kosong' });
  const text = csv.replace(/^\uFEFF/, '').trim();
  const lines = text.split(/\r?\n/).filter((ln) => ln.trim());
  if (!lines.length) return res.status(400).json({ error: 'Tidak ada baris data' });
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  let imported = 0;
  let failed = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, idx) => { row[key] = cols[idx] !== undefined ? cols[idx] : ''; });
    const routerId = parseInt(row.router_id, 10);
    const routerRow = db.getRouterById(routerId);
    if (!routerId || !routerRow) { failed++; continue; }
    try {
      const saved = await db.saveCustomer({
        router_id: routerId,
        package_id: row.package_id ? parseInt(row.package_id, 10) : null,
        name: row.name || row.username,
        username: row.username,
        password: row.password || '123456',
        type: row.type === 'hotspot' ? 'hotspot' : 'pppoe',
        status: row.status === 'isolir' ? 'isolir' : 'active',
        address: row.address || null,
        phone: row.phone || null,
      });
      await provisioning.syncNewCustomer(routerRow, saved);
      imported++;
    } catch (e) { failed++; }
  }
  res.json({ ok: true, imported, failed });
});

module.exports = router;
