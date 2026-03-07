const mikrotik = require('./mikrotik');
const radiusDb = require('./radiusDb');

function getMode(router) {
  return router && router.integration_mode === 'radius' ? 'radius' : 'api';
}

async function testConnection(router) {
  const mode = getMode(router);
  if (mode === 'radius') {
    await radiusDb.ping();
    return { mode };
  }
  const api = await mikrotik.connect(router);
  api.close();
  return { mode };
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
  const api = await mikrotik.connect(router);
  try {
    const counts = await mikrotik.getActiveSessions(api);
    return {
      mode: getMode(router),
      ...counts,
    };
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
};

