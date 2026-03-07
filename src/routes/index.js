const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, loadUser } = require('../middleware/auth');
const provisioning = require('../services/provisioning');
const appConfig = require('../services/appConfig');
const activityLog = require('../services/activityLog');
const supportTickets = require('../services/supportTickets');
const odpPop = require('../services/odpPop');
const supabaseAuth = require('../services/supabaseAuth');
const vpnProfiles = require('../services/vpnProfiles');

router.use(loadUser);

function parseCsvLine(line) {
  const out = [];
  let curr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && inQuotes && line[i + 1] === '"') {
      curr += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(curr.trim());
      curr = '';
      continue;
    }
    curr += ch;
  }
  out.push(curr.trim());
  return out;
}

function parseCustomerImportCsv(raw) {
  const text = (raw || '').replace(/^\uFEFF/, '').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/).filter((ln) => ln.trim() !== '');
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, idx) => {
      row[key] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

// Bila USE_VITE_UI=1, admin pakai React; /, /login, /dashboard diserahkan ke SPA fallback
const useEjsAdmin = process.env.USE_VITE_UI !== '1';

if (useEjsAdmin) {
  router.get('/', (req, res) => {
    if (req.session?.userId) return res.redirect('/dashboard');
    res.redirect('/login');
  });
}

if (useEjsAdmin) {
  router.get('/dashboard', requireAuth, (req, res) => {
  const stats = db.getStats();
  const payments = db.getPayments();
  const bills = db.getBills();
  const customers = db.getCustomers();
  const packages = db.getPackages();
  const vouchers = db.getVouchers ? db.getVouchers() : [];

  // Revenue by month (last 12 months)
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

  // Customers by type (for doughnut)
  const customerByType = { hotspot: 0, pppoe: 0 };
  (customers || []).forEach((c) => {
    const t = (c.type || '').toLowerCase();
    if (t === 'hotspot') customerByType.hotspot++;
    else customerByType.pppoe++;
  });

  // Bills by status
  const billsByStatus = { paid: 0, unpaid: 0 };
  (bills || []).forEach((b) => {
    if (b.status === 'paid') billsByStatus.paid++;
    else billsByStatus.unpaid++;
  });

  // Recent payments (last 10)
  const recentPayments = (payments || []).slice(0, 10);

  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user,
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
}

// ---------- Users Session ----------
router.get('/users-session', requireAuth, async (req, res) => {
  const customers = db.getCustomers();
  const vouchers = db.getData().vouchers || [];
  const pppUsers = customers.filter((c) => c.type === 'pppoe');
  const hotspotUsers = customers.filter((c) => c.type === 'hotspot');
  const activePpp = pppUsers.filter((c) => c.status === 'active').length;
  const activeHotspot = hotspotUsers.filter((c) => c.status === 'active').length;
  const usedVouchers = vouchers.filter((v) => parseInt(v.used, 10) === 1).length;
  const routers = db.getAllRouters();
  const perRouterLive = await Promise.all(
    routers.map(async (r) => {
      try {
        const live = await provisioning.getLiveSessions(r);
        return { router: r, ...live, ok: true };
      } catch (e) {
        return { router: r, pppActive: 0, hotspotActive: 0, ok: false, error: e.message || 'Gagal ambil session live' };
      }
    })
  );
  const livePpp = perRouterLive.reduce((s, r) => s + (r.pppActive || 0), 0);
  const liveHotspot = perRouterLive.reduce((s, r) => s + (r.hotspotActive || 0), 0);
  res.render('users-session/index', {
    title: 'Users Session',
    user: req.user,
    stats: {
      pppUsers: pppUsers.length,
      hotspotUsers: hotspotUsers.length,
      activePpp,
      activeHotspot,
      livePpp,
      liveHotspot,
      totalVouchers: vouchers.length,
      usedVouchers,
      unusedVouchers: Math.max(vouchers.length - usedVouchers, 0),
    },
    perRouterLive,
  });
});

router.get('/users-session/hotspot', requireAuth, async (req, res) => {
  const customers = db.getCustomers();
  const routers = db.getAllRouters();
  const hotspotUsers = customers.filter((c) => c.type === 'hotspot');
  const perRouterLive = await Promise.all(
    routers.map(async (r) => {
      try {
        const live = await provisioning.getLiveSessions(r);
        return { router: r, hotspotActive: live.hotspotActive || 0, pppActive: live.pppActive || 0, ok: true };
      } catch (e) {
        return { router: r, hotspotActive: 0, pppActive: 0, ok: false, error: e.message };
      }
    })
  );
  res.render('users-session/hotspot', {
    title: 'Users Session - Hotspot',
    user: req.user,
    active: 'users-session',
    subactive: 'hotspot',
    hotspotUsers,
    perRouterLive,
  });
});

router.get('/users-session/ppp', requireAuth, async (req, res) => {
  const customers = db.getCustomers();
  const routers = db.getAllRouters();
  const pppUsers = customers.filter((c) => c.type === 'pppoe');
  const perRouterLive = await Promise.all(
    routers.map(async (r) => {
      try {
        const live = await provisioning.getLiveSessions(r);
        return { router: r, hotspotActive: live.hotspotActive || 0, pppActive: live.pppActive || 0, ok: true };
      } catch (e) {
        return { router: r, hotspotActive: 0, pppActive: 0, ok: false, error: e.message };
      }
    })
  );
  res.render('users-session/ppp', {
    title: 'Users Session - PPP',
    user: req.user,
    active: 'users-session',
    subactive: 'ppp',
    pppUsers,
    perRouterLive,
  });
});

// ---------- App Settings ----------
router.get('/app-settings', requireAuth, async (req, res) => {
  let adminUsers = [];
  try {
    adminUsers = await supabaseAuth.listAdminUsers();
  } catch (e) {
    adminUsers = [];
  }
  res.render('app-settings/index', {
    title: 'App Settings',
    user: req.user,
    settings: appConfig.getSettings(),
    adminUsers,
    saved: req.query.saved,
    userSaved: req.query.user_saved,
    error: req.query.error,
  });
});

router.get('/app-settings/general', requireAuth, async (req, res) => {
  let adminUsers = [];
  try { adminUsers = await supabaseAuth.listAdminUsers(); } catch (e) {}
  res.render('app-settings/index', {
    title: 'General Settings',
    user: req.user,
    active: 'app-settings',
    subactive: 'general',
    settings: appConfig.getSettings(),
    adminUsers,
    saved: req.query.saved,
    userSaved: req.query.user_saved,
    error: req.query.error,
  });
});

router.get('/app-settings/localisation', requireAuth, async (req, res) => {
  let adminUsers = [];
  try { adminUsers = await supabaseAuth.listAdminUsers(); } catch (e) {}
  res.render('app-settings/index', {
    title: 'Localisation',
    user: req.user,
    active: 'app-settings',
    subactive: 'localisation',
    settings: appConfig.getSettings(),
    adminUsers,
    saved: req.query.saved,
    userSaved: req.query.user_saved,
    error: req.query.error,
  });
});

router.get('/app-settings/invoice-logo', requireAuth, async (req, res) => {
  let adminUsers = [];
  try { adminUsers = await supabaseAuth.listAdminUsers(); } catch (e) {}
  res.render('app-settings/index', {
    title: 'Invoice Logo',
    user: req.user,
    active: 'app-settings',
    subactive: 'invoice-logo',
    settings: appConfig.getSettings(),
    adminUsers,
    saved: req.query.saved,
    userSaved: req.query.user_saved,
    error: req.query.error,
  });
});

router.post('/app-settings', requireAuth, async (req, res) => {
  try {
    await appConfig.saveSettings({
      app_name: (req.body.app_name || '').trim() || 'Radius One',
      company_name: (req.body.company_name || '').trim(),
      company_address: (req.body.company_address || '').trim(),
      company_phone: (req.body.company_phone || '').trim(),
      company_email: (req.body.company_email || '').trim(),
      invoice_note: (req.body.invoice_note || '').trim(),
      currency_symbol: (req.body.currency_symbol || '').trim() || 'Rp',
    });
    return res.redirect('/app-settings?saved=1');
  } catch (e) {
    return res.redirect('/app-settings?error=' + encodeURIComponent(e.message || 'Gagal menyimpan pengaturan'));
  }
});

router.post('/app-settings/admin-users', requireAuth, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'admin');
    if (!username || !email || !password) throw new Error('Username, email, dan password wajib diisi.');

    await supabaseAuth.createAdminUser({ username, email, password, role });
    return res.redirect('/app-settings?user_saved=1');
  } catch (e) {
    return res.redirect('/app-settings?error=' + encodeURIComponent(e.message || 'Gagal menambah user admin'));
  }
});

// ---------- ODP | POP Data ----------
router.get('/odp-pop', requireAuth, async (req, res) => {
  const items = await odpPop.list();
  res.render('odp-pop/list', {
    title: 'ODP | POP Data',
    user: req.user,
    items,
    saved: req.query.saved,
    error: req.query.error,
  });
});

router.get('/odp-pop/map', requireAuth, async (req, res) => {
  const items = await odpPop.list();
  res.render('odp-pop/map', {
    title: 'ODP | POP - View Map',
    user: req.user,
    active: 'odp-pop',
    subactive: 'odp-map',
    items: items.filter((i) => i.latitude && i.longitude),
  });
});

router.get('/odp-pop/add', requireAuth, (req, res) => {
  res.render('odp-pop/form', { title: 'Tambah ODP | POP', user: req.user, item: null });
});

router.get('/odp-pop/edit/:id', requireAuth, async (req, res) => {
  const item = await odpPop.getById(req.params.id);
  if (!item) return res.redirect('/odp-pop');
  res.render('odp-pop/form', { title: 'Edit ODP | POP', user: req.user, item });
});

router.post('/odp-pop/save', requireAuth, async (req, res) => {
  try {
    await odpPop.save({
      id: req.body.id || null,
      name: (req.body.name || '').trim(),
      type: req.body.type || 'odp',
      area: (req.body.area || '').trim(),
      address: (req.body.address || '').trim(),
      latitude: (req.body.latitude || '').trim(),
      longitude: (req.body.longitude || '').trim(),
      note: (req.body.note || '').trim(),
      status: req.body.status || 'active',
    });
    return res.redirect('/odp-pop?saved=1');
  } catch (e) {
    return res.redirect('/odp-pop?error=' + encodeURIComponent(e.message || 'Gagal simpan ODP/POP'));
  }
});

router.post('/odp-pop/delete/:id', requireAuth, async (req, res) => {
  try {
    await odpPop.remove(req.params.id);
  } catch (e) {
    return res.redirect('/odp-pop?error=' + encodeURIComponent(e.message || 'Gagal hapus ODP/POP'));
  }
  res.redirect('/odp-pop');
});

// ---------- Support Tickets ----------
router.get('/support-tickets', requireAuth, async (req, res) => {
  const status = req.query.status || 'all';
  const tickets = await supportTickets.list(status === 'all' ? undefined : status);
  const customers = db.getCustomers();
  const enriched = tickets.map((t) => ({
    ...t,
    customer_name: t.customer_id ? (customers.find((c) => parseInt(c.id, 10) === parseInt(t.customer_id, 10))?.name || null) : null,
  }));
  res.render('support-tickets/list', {
    title: 'Support Tickets',
    user: req.user,
    tickets: enriched,
    status,
    saved: req.query.saved,
    error: req.query.error,
  });
});

router.get('/support-tickets/add', requireAuth, (req, res) => {
  res.render('support-tickets/form', {
    title: 'Buat Ticket',
    user: req.user,
    ticket: null,
    customers: db.getCustomers(),
  });
});

router.get('/support-tickets/edit/:id', requireAuth, async (req, res) => {
  const ticket = await supportTickets.getById(req.params.id);
  if (!ticket) return res.redirect('/support-tickets');
  res.render('support-tickets/form', {
    title: 'Edit Ticket',
    user: req.user,
    ticket,
    customers: db.getCustomers(),
  });
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
    return res.redirect('/support-tickets?saved=1');
  } catch (e) {
    return res.redirect('/support-tickets?error=' + encodeURIComponent(e.message || 'Gagal menyimpan ticket'));
  }
});

router.post('/support-tickets/close/:id', requireAuth, async (req, res) => {
  try {
    await supportTickets.close(req.params.id);
  } catch (e) {
    return res.redirect('/support-tickets?error=' + encodeURIComponent(e.message || 'Gagal menutup ticket'));
  }
  res.redirect('/support-tickets?status=open');
});

if (useEjsAdmin) {
  router.get('/login', (req, res) => {
    if (req.session?.userId) return res.redirect('/dashboard');
    res.render('login', { title: 'Login', error: null });
  });

  router.post('/login', async (req, res) => {
    const { login: loginFn } = require('../middleware/auth');
    const user = await loginFn(req.body.username, req.body.password);
    if (!user) {
      return res.render('login', { title: 'Login', error: 'Username atau password salah.' });
    }
    req.session.userId = user.id;
    if (user.access_token) {
      req.session.supabaseAuth = {
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        expires_at: user.expires_at,
        auth_user_id: user.auth_user_id,
        email: user.email,
      };
    }
    req.session.save(() => res.redirect('/dashboard'));
  });
}

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------- Routers (MikroTik) ----------
router.get('/routers', requireAuth, (req, res) => {
  const list = db.getAllRouters();
  const error = req.query.error || null;
  const testOk = req.query.test === 'ok' ? req.query.name : null;
  const testError = req.query.test === 'error' ? (req.query.msg || 'Koneksi gagal') : null;
  res.render('routers/list', { title: 'Router MikroTik', user: req.user, routers: list, error, testOk, testError });
});

router.get('/routers/add', requireAuth, (req, res) => {
  res.render('routers/form', { title: 'Tambah Router', user: req.user, router: null });
});

router.get('/routers/edit/:id', requireAuth, (req, res) => {
  const router = db.getRouterById(req.params.id);
  if (!router) return res.redirect('/routers');
  res.render('routers/form', { title: 'Edit Router', user: req.user, router });
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
  } catch (err) {
    return res.redirect('/routers?error=' + encodeURIComponent(err.message || 'Gagal menyimpan'));
  }
  res.redirect('/routers');
});

router.post('/routers/delete/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteRouter(req.params.id);
  } catch (err) {
    return res.redirect('/routers?error=' + encodeURIComponent(err.message || 'Gagal menghapus'));
  }
  res.redirect('/routers');
});

// Test koneksi ke router
router.get('/routers/test/:id', requireAuth, async (req, res) => {
  const routerRow = db.getRouterById(req.params.id);
  if (!routerRow) return res.redirect('/routers');
  try {
    await provisioning.testConnection(routerRow);
    return res.redirect('/routers?test=ok&name=' + encodeURIComponent(routerRow.name));
  } catch (err) {
    return res.redirect('/routers?test=error&msg=' + encodeURIComponent(err.message || 'Koneksi gagal'));
  }
});

// ---------- VPN Radius (seperti RL Radius) ----------
router.get('/vpn-radius', requireAuth, (req, res) => {
  const routers = db.getAllRouters();
  const profiles = vpnProfiles.getProfiles();
  const activeProfile = vpnProfiles.getActiveProfile();
  res.render('vpn-radius/index', {
    title: 'VPN Radius',
    user: req.user,
    routers,
    profiles,
    activeProfile,
    activeProfileId: activeProfile ? activeProfile.id : '',
    error: req.query.error || null,
    saved: req.query.saved || null,
    generated: null,
  });
});

router.post('/vpn-radius/profiles/add', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.addProfile({
      name: req.body.name,
      server_endpoint: req.body.server_endpoint,
      server_public_key: req.body.server_public_key,
      vpn_network: req.body.vpn_network,
    });
  } catch (e) {
    return res.redirect('/vpn-radius?error=' + encodeURIComponent(e.message || 'Gagal menambah profile VPN'));
  }
  res.redirect('/vpn-radius?saved=profile');
});

router.post('/vpn-radius/profiles/activate', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.setActiveProfile(req.body.profile_id);
  } catch (e) {
    return res.redirect('/vpn-radius?error=' + encodeURIComponent(e.message || 'Gagal mengganti profile aktif'));
  }
  res.redirect('/vpn-radius?saved=active');
});

router.post('/vpn-radius/profiles/delete/:id', requireAuth, async (req, res) => {
  try {
    await vpnProfiles.deleteProfile(req.params.id);
  } catch (e) {
    return res.redirect('/vpn-radius?error=' + encodeURIComponent(e.message || 'Gagal menghapus profile'));
  }
  res.redirect('/vpn-radius?saved=deleted');
});

router.get('/vpn-radius/generate/:id', requireAuth, (req, res) => {
  const router = db.getRouterById(req.params.id);
  if (!router) return res.redirect('/vpn-radius');
  const profiles = vpnProfiles.getProfiles();
  const activeProfile = vpnProfiles.getActiveProfile();
  if (!activeProfile) return res.redirect('/vpn-radius?error=Belum+ada+profile+VPN');
  const vpnRadius = require('../services/vpnRadius');
  const usedIps = db.getAllRouters()
    .filter((r) => r.vpn_profile_id === activeProfile.id || !r.vpn_profile_id)
    .map((r) => r.vpn_ip)
    .filter(Boolean);
  const vpnIp = vpnRadius.nextVpnIp(usedIps, activeProfile.vpn_network);
  if (!vpnIp) return res.redirect('/vpn-radius?error=IP+pool+penuh');
  const { privateKey, publicKey } = vpnRadius.generateKeyPair();
  const { clientConfig, serverPeerBlock } = vpnRadius.generateWireGuardConfig(
    router.name,
    privateKey,
    publicKey,
    vpnIp,
    activeProfile.server_public_key,
    activeProfile.server_endpoint,
    activeProfile.vpn_network
  );
  const routers = db.getAllRouters();
  res.render('vpn-radius/index', {
    title: 'VPN Radius',
    user: req.user,
    routers,
    profiles,
    activeProfile,
    activeProfileId: activeProfile.id,
    error: null,
    saved: null,
    generated: {
      routerId: router.id,
      routerName: router.name,
      profileId: activeProfile.id,
      profileName: activeProfile.name,
      vpnNetwork: activeProfile.vpn_network,
      vpnIp,
      clientConfig,
      serverPeerBlock,
      clientPrivateKey: privateKey,
      clientPublicKey: publicKey,
    },
  });
});

router.post('/vpn-radius/apply', requireAuth, async (req, res) => {
  const { router_id, vpn_ip, profile_id } = req.body;
  const r = db.getRouterById(router_id);
  if (!r || !vpn_ip) return res.redirect('/vpn-radius');
  try {
    await db.saveRouter({
      id: r.id,
      name: r.name,
      host: r.host,
      port: r.port,
      username: r.username,
      password: r.password,
      is_ssl: r.is_ssl,
      integration_mode: r.integration_mode || 'api',
      use_vpn: true,
      vpn_ip: vpn_ip.trim(),
      vpn_profile_id: profile_id || null,
    });
  } catch (e) {
    return res.redirect('/routers?error=' + encodeURIComponent(e.message || 'Gagal simpan VPN'));
  }
  res.redirect('/routers?msg=vpn_applied');
});

// ---------- Paket ----------
router.get('/packages', requireAuth, (req, res) => {
  const list = db.getPackages();
  res.render('packages/list', { title: 'Paket', user: req.user, packages: list });
});

// Service Plan submenu (reuse packages list with active: service-plan)
router.get('/service-plan/bandwidth', requireAuth, (req, res) => {
  const list = db.getPackages();
  res.render('packages/list', { title: 'Bandwidth', user: req.user, packages: list, active: 'service-plan', subactive: 'bandwidth' });
});
router.get('/service-plan/profile-group', requireAuth, (req, res) => {
  const list = db.getPackages();
  res.render('packages/list', { title: 'Profile Group', user: req.user, packages: list, active: 'service-plan', subactive: 'profile-group' });
});
router.get('/service-plan/hotspot', requireAuth, (req, res) => {
  const list = db.getPackages().filter((p) => (p.type || '').toLowerCase() === 'hotspot');
  res.render('packages/list', { title: 'Hotspot Profile', user: req.user, packages: list, active: 'service-plan', subactive: 'hotspot-profile' });
});
router.get('/service-plan/ppp', requireAuth, (req, res) => {
  const list = db.getPackages().filter((p) => (p.type || '').toLowerCase() === 'pppoe');
  res.render('packages/list', { title: 'PPP Profile', user: req.user, packages: list, active: 'service-plan', subactive: 'ppp-profile' });
});

router.get('/packages/add', requireAuth, (req, res) => {
  res.render('packages/form', { title: 'Tambah Paket', user: req.user, pkg: null });
});

router.get('/packages/edit/:id', requireAuth, (req, res) => {
  const pkg = db.getPackageById(req.params.id);
  if (!pkg) return res.redirect('/packages');
  res.render('packages/form', { title: 'Edit Paket', user: req.user, pkg });
});

router.post('/packages/save', requireAuth, async (req, res) => {
  const { id, name, type, price_monthly, speed_limit, validity_days } = req.body;
  try {
    await db.savePackage({
      id: id || null,
      name,
      type,
      price_monthly,
      speed_limit,
      validity_days,
    });
  } catch (e) {
    return res.redirect('/packages?error=' + encodeURIComponent(e.message || 'Gagal menyimpan'));
  }
  res.redirect('/packages');
});

router.post('/packages/delete/:id', requireAuth, async (req, res) => {
  try {
    await db.deletePackage(req.params.id);
  } catch (e) {
    return res.redirect('/packages?error=' + encodeURIComponent(e.message || 'Gagal menghapus'));
  }
  res.redirect('/packages');
});

// ---------- Pelanggan ----------
router.get('/customers', requireAuth, (req, res) => {
  const list = db.getCustomers();
  const syncError = req.query.sync_error || null;
  res.render('customers/list', { title: 'Pelanggan', user: req.user, customers: list, syncError });
});

router.get('/customers/add', requireAuth, (req, res) => {
  const routers = db.getRouters();
  const packages = db.getPackages();
  res.render('customers/form', { title: 'Tambah Pelanggan', user: req.user, customer: null, routers, packages });
});

router.get('/customers/edit/:id', requireAuth, (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) return res.redirect('/customers');
  const routers = db.getRouters();
  const packages = db.getPackages();
  res.render('customers/form', { title: 'Edit Pelanggan', user: req.user, customer, routers, packages });
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
    // Pelanggan baru: tambahkan user ke MikroTik (PPPoE secret / Hotspot user)
    if (isNew && saved) {
      const routerRow = db.getRouterById(router_id);
      if (routerRow) {
        try {
          await provisioning.syncNewCustomer(routerRow, saved);
        } catch (err) {
          console.error('Provisioning add user error:', err.message);
          return res.redirect('/customers?sync_error=' + encodeURIComponent(err.message || 'Gagal sinkron user'));
        }
      }
    }
  } catch (e) {
    if (e.message === 'UNIQUE') {
      return res.render('customers/form', {
        title: id ? 'Edit Pelanggan' : 'Tambah Pelanggan',
        user: req.user,
        customer: { ...req.body, id },
        routers: db.getRouters(),
        packages: db.getPackages(),
        error: 'Username sudah dipakai di router ini.',
      });
    }
    throw e;
  }
  res.redirect('/customers');
});

router.post('/customers/isolir/:id', requireAuth, async (req, res) => {
  const c = db.getCustomerById(req.params.id);
  if (!c) return res.redirect('/customers');
  const routerRow = db.getRouterById(c.router_id);
  if (routerRow) {
    try {
      await provisioning.isolateCustomer(routerRow, c);
    } catch (err) {
      console.error('Provisioning isolir error:', err.message);
    }
  }
  await db.updateCustomerStatus(c.id, 'isolir');
  res.redirect('/customers');
});

router.post('/customers/aktifkan/:id', requireAuth, async (req, res) => {
  const c = db.getCustomerById(req.params.id);
  if (!c) return res.redirect('/customers');
  const routerRow = db.getRouterById(c.router_id);
  if (routerRow) {
    try {
      await provisioning.activateCustomer(routerRow, c);
    } catch (err) {
      console.error('Provisioning enable error:', err.message);
    }
  }
  await db.updateCustomerStatus(c.id, 'active');
  res.redirect('/customers');
});

// ---------- Tagihan ----------
router.get('/bills', requireAuth, (req, res) => {
  const list = db.getBills();
  res.render('bills/list', { title: 'Tagihan', user: req.user, bills: list, recurring: req.query.recurring });
});

router.get('/bills/add', requireAuth, (req, res) => {
  const customers = db.getData().customers.filter((c) => c.status === 'active');
  res.render('bills/form', { title: 'Tambah Tagihan', user: req.user, bill: null, customers });
});

router.post('/bills/save', requireAuth, async (req, res) => {
  const { customer_id, period_start, period_end, amount, due_date } = req.body;
  try {
    await db.addBill({ customer_id, period_start, period_end, amount, due_date });
  } catch (e) {
    return res.redirect('/bills?error=' + encodeURIComponent(e.message || 'Gagal menambah tagihan'));
  }
  res.redirect('/bills');
});

router.post('/bills/bayar/:id', requireAuth, async (req, res) => {
  try {
    await db.payBill(req.params.id, req.body.method || 'manual');
  } catch (e) {
    return res.redirect('/bills?error=' + encodeURIComponent(e.message || 'Gagal membayar'));
  }
  res.redirect('/bills');
});

router.get('/bills/unpaid', requireAuth, (req, res) => {
  const list = db.getBills().filter((b) => b.status === 'unpaid');
  res.render('bills/list', { title: 'Unpaid Invoice', user: req.user, bills: list, recurring: null, unpaidOnly: true, active: 'bills', subactive: 'unpaid' });
});

router.get('/bills/generate-recurring', requireAuth, async (req, res) => {
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
      await db.addBill({
        customer_id: c.id,
        period_start: periodStart,
        period_end: periodEnd,
        amount,
        due_date: dueDate,
      });
      added++;
    } catch (e) {
      console.error('addBill error:', e.message);
    }
  }
  res.redirect('/bills?recurring=' + added);
});

router.get('/bills/:id/invoice', requireAuth, (req, res) => {
  if (req.params.id === 'unpaid') return res.redirect('/bills/unpaid');
  const bill = db.getBillById(req.params.id);
  if (!bill) return res.redirect('/bills');
  const customer = db.getCustomerById(bill.customer_id);
  const settings = appConfig.getSettings();
  res.render('bills/invoice', { title: 'Invoice', user: req.user, bill, customer, settings });
});

// ---------- Laporan ----------
router.get('/reports', requireAuth, (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const payments = db.getPayments(from ? from + 'T00:00:00.000Z' : undefined, to || undefined);
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  res.render('reports/transactions', {
    title: 'Laporan Transaksi',
    user: req.user,
    payments,
    total,
    from,
    to,
  });
});

router.get('/reports/payout', requireAuth, (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const payments = db.getPayments(from ? from + 'T00:00:00.000Z' : undefined, to || undefined);
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
  res.render('reports/payout', {
    title: 'Payout',
    user: req.user,
    active: 'reports',
    subactive: 'payout',
    payments,
    total,
    from,
    to,
  });
});

router.get('/reports/net-profit', requireAuth, (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const payments = db.getPayments(from ? from + 'T00:00:00.000Z' : undefined, to || undefined);
  const totalIn = payments.reduce((s, p) => s + (p.amount || 0), 0);
  res.render('reports/net-profit', {
    title: 'Net Profit',
    user: req.user,
    active: 'reports',
    subactive: 'net-profit',
    totalIn,
    from,
    to,
  });
});

router.get('/reports/statistics', requireAuth, (req, res) => {
  const stats = db.getStats();
  const bills = db.getBills();
  const paid = bills.filter((b) => b.status === 'paid');
  const unpaid = bills.filter((b) => b.status === 'unpaid');
  const totalPaid = paid.reduce((s, b) => s + (b.amount || 0), 0);
  const totalUnpaid = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
  res.render('reports/statistics', {
    title: 'Statistics',
    user: req.user,
    active: 'reports',
    subactive: 'statistics',
    stats,
    totalPaid,
    totalUnpaid,
    paidCount: paid.length,
    unpaidCount: unpaid.length,
  });
});

router.get('/reports/export', requireAuth, (req, res) => {
  const from = req.query.from || '';
  const to = req.query.to || '';
  const payments = db.getPayments(from || undefined, to || undefined);
  const csv = [
    ['Tanggal', 'Pelanggan', 'Jumlah', 'Metode'].join(','),
    ...payments.map((p) =>
      [
        (p.paid_at || '').slice(0, 19),
        (p.customer_name || '').replace(/,/g, ' '),
        p.amount,
        p.method || '',
      ].join(',')
    ),
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=laporan-transaksi.csv');
  res.send('\uFEFF' + csv);
});

// ---------- System Tools ----------
router.get('/system-tools', requireAuth, (req, res) => {
  res.render('system-tools/index', {
    title: 'System Tools',
    user: req.user,
    useSupabase: true,
    restored: req.query.restored,
    imported: req.query.imported,
    failed: req.query.failed,
    error: req.query.error,
  });
});

router.get('/system-tools/backup', requireAuth, (req, res) => {
  const payload = {
    exported_at: new Date().toISOString(),
    app_settings: appConfig.getSettings(),
    database: db.getData(),
  };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=radius-one-backup.json');
  res.send(JSON.stringify(payload, null, 2));
});

router.post('/system-tools/restore', requireAuth, async (req, res) => {
  try {
    const raw = (req.body.backup_json || '').trim();
    if (!raw) throw new Error('Backup JSON wajib diisi.');
    const parsed = JSON.parse(raw);
    if (!parsed.database) throw new Error('Format backup tidak valid (database tidak ditemukan).');
    const mergedImport = {
      ...(parsed.database || {}),
      app_settings: parsed.app_settings || parsed.database.app_settings || {},
    };
    await db.replaceAllData(mergedImport);
    return res.redirect('/system-tools?restored=1');
  } catch (e) {
    return res.redirect('/system-tools?error=' + encodeURIComponent(e.message || 'Restore gagal'));
  }
});

router.post('/system-tools/import-users', requireAuth, async (req, res) => {
  try {
    const csv = (req.body.import_csv || '').trim();
    if (!csv) throw new Error('CSV import tidak boleh kosong.');
    const rows = parseCustomerImportCsv(csv);
    if (!rows.length) throw new Error('Tidak ada baris data yang bisa diimport.');

    let imported = 0;
    let failed = 0;
    for (const row of rows) {
      const routerId = parseInt(row.router_id, 10);
      const routerRow = db.getRouterById(routerId);
      if (!routerId || !routerRow) {
        failed++;
        continue;
      }
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
      } catch (e) {
        failed++;
      }
    }
    return res.redirect('/system-tools?imported=' + imported + '&failed=' + failed);
  } catch (e) {
    return res.redirect('/system-tools?error=' + encodeURIComponent(e.message || 'Import user gagal'));
  }
});

// ---------- Software Logs ----------
router.get('/software-logs', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  const logs = activityLog.readRecent(limit);
  res.render('software-logs/index', {
    title: 'Software Logs',
    user: req.user,
    logs,
    limit,
  });
});

router.get('/software-logs/radius-auth', requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  const logs = activityLog.readRecent(limit);
  res.render('software-logs/radius-auth', {
    title: 'Radius Auth Log',
    user: req.user,
    active: 'software-logs',
    subactive: 'radius-auth',
    logs,
    limit,
  });
});

// ---------- Neighbor List ----------
router.get('/neighbor-list', requireAuth, async (req, res) => {
  const routers = db.getAllRouters();
  res.render('neighbor-list/index', {
    title: 'Neighbor List',
    user: req.user,
    routers,
    neighbors: [],
  });
});

// ---------- Online Payment ----------
router.get('/online-payment', requireAuth, (req, res) => {
  res.render('online-payment/index', {
    title: 'Online Payment',
    user: req.user,
  });
});

// ---------- Licence Info ----------
router.get('/licence-info', requireAuth, (req, res) => {
  res.render('licence-info/index', {
    title: 'Licence Info',
    user: req.user,
  });
});

// ---------- Client area (portal pelanggan) ----------
function requireClientAuth(req, res, next) {
  if (!req.session || !req.session.clientCustomerId) {
    return res.redirect('/client/login');
  }
  next();
}

function loadClient(req, res, next) {
  if (req.session?.clientCustomerId) {
    req.clientCustomer = db.getCustomerById(req.session.clientCustomerId);
  }
  next();
}

router.get('/client/login', (req, res) => {
  if (req.session?.clientCustomerId) return res.redirect('/client');
  res.render('client/login', { title: 'Login Pelanggan', error: null });
});

router.post('/client/login', (req, res) => {
  const customer = db.getCustomerByUsernamePassword(req.body.username, req.body.password);
  if (!customer) {
    return res.render('client/login', { title: 'Login Pelanggan', error: 'Username atau password salah.' });
  }
  req.session.clientCustomerId = customer.id;
  req.session.save(() => res.redirect('/client'));
});

router.get('/client/logout', (req, res) => {
  req.session.clientCustomerId = null;
  req.session.save(() => res.redirect('/client/login'));
});

router.get('/client', loadClient, requireClientAuth, (req, res) => {
  const bills = db.getBillsByCustomerId(req.clientCustomer.id);
  const unpaid = bills.filter((b) => b.status === 'unpaid');
  const totalUnpaid = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
  res.render('client/dashboard', {
    title: 'Portal Pelanggan',
    customer: req.clientCustomer,
    bills,
    unpaidCount: unpaid.length,
    totalUnpaid,
    paid: req.query.paid,
  });
});

router.get('/client/bills', loadClient, requireClientAuth, (req, res) => {
  const bills = db.getBillsByCustomerId(req.clientCustomer.id);
  res.render('client/bills', { title: 'Tagihan Saya', customer: req.clientCustomer, bills });
});

router.post('/client/bills/:id/pay', loadClient, requireClientAuth, async (req, res) => {
  const bill = db.getBillById(req.params.id);
  if (!bill || bill.customer_id !== req.clientCustomer.id) return res.redirect('/client');
  try {
    await db.payBill(bill.id, req.body.method || 'client');
  } catch (e) {
    return res.redirect('/client?error=' + encodeURIComponent(e.message || 'Gagal membayar'));
  }
  res.redirect('/client?paid=1');
});

// ---------- Voucher ----------
router.get('/vouchers', requireAuth, (req, res) => {
  const list = db.getVouchers();
  res.render('vouchers/list', { title: 'Voucher Hotspot', user: req.user, vouchers: list });
});

router.get('/vouchers/generate', requireAuth, (req, res) => {
  const routers = db.getRouters();
  const packages = db.getPackages().filter((p) => p.type === 'hotspot');
  res.render('vouchers/generate', { title: 'Generate Voucher', user: req.user, routers, packages });
});

router.post('/vouchers/generate', requireAuth, async (req, res) => {
  const { router_id, package_id, prefix, count, duration_minutes } = req.body;
  const n = Math.min(parseInt(count, 10) || 10, 100);
  const dur = parseInt(duration_minutes, 10) || 60;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const code = (prefix || 'V') + Date.now().toString(36).toUpperCase() + i;
    rows.push({ router_id, package_id: package_id || null, code, duration_minutes: dur });
  }
  try {
    await db.addVouchers(rows);
  } catch (e) {
    return res.redirect('/vouchers?error=' + encodeURIComponent(e.message || 'Gagal generate voucher'));
  }
  res.redirect('/vouchers');
});

module.exports = router;
