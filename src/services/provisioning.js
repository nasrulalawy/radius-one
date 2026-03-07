const mikrotik = require('./mikrotik');
const radiusDb = require('./radiusDb');

function getMode(router) {
  const mode = (router && router.integration_mode || '').toString().toLowerCase();
  return mode === 'radius' ? 'radius' : 'api';
}

async function testConnection(router) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.ping();
    return { mode, deviceReachable: null };
  }
  const api = await mikrotik.connect(router);
  api.close();
  return { mode, deviceReachable: true };
}

async function syncNewCustomer(router, customer) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.upsertCustomer(customer);
    return;
  }
  const api = await mikrotik.connect(router);
  try {
    if (customer.type === 'pppoe') {
      await mikrotik.addPppoeSecret(api, customer.username, customer.password, customer.name);
    } else {
      await mikrotik.addHotspotUser(api, customer.username, customer.password, customer.name);
    }
  } finally {
    api.close();
  }
}

async function isolateCustomer(router, customer) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.isolateCustomer(customer.username);
    return;
  }
  const api = await mikrotik.connect(router);
  try {
    if (customer.type === 'pppoe') await mikrotik.disablePppoeSecret(api, customer.username);
    else await mikrotik.disableHotspotUser(api, customer.username);
  } finally {
    api.close();
  }
}

async function activateCustomer(router, customer) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.activateCustomer(customer.username);
    return;
  }
  const api = await mikrotik.connect(router);
  try {
    if (customer.type === 'pppoe') await mikrotik.enablePppoeSecret(api, customer.username);
    else await mikrotik.enableHotspotUser(api, customer.username);
  } finally {
    api.close();
  }
}

async function getLiveSessions(router) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.ping();
    return { mode, pppActive: 0, hotspotActive: 0 };
  }
  const api = await mikrotik.connect(router);
  try {
    const counts = await mikrotik.getActiveSessions(api);
    return {
      mode,
      ...counts,
    };
  } finally {
    api.close();
  }
}

/**
 * Sinkron voucher hotspot ke router MikroTik (real API).
 * @param {Object} router - router row dari DB
 * @param {Array<{code:string, duration_minutes:number}>} vouchers
 */
async function syncVouchersToRouter(router, vouchers) {
  if (getMode(router) === 'radius') {
    throw new Error('Voucher hotspot harus ke router mode API, bukan RADIUS');
  }
  const api = await mikrotik.connect(router);
  try {
    for (const v of vouchers) {
      const dur = parseInt(v.duration_minutes, 10) || 60;
      const limitBytes = dur * 10 * 1024 * 1024;
      await mikrotik.addHotspotVoucher(api, v.code, v.code, limitBytes);
    }
  } finally {
    api.close();
  }
}

module.exports = {
  getMode,
  testConnection,
  syncNewCustomer,
  isolateCustomer,
  activateCustomer,
  getLiveSessions,
  syncVouchersToRouter,
};

