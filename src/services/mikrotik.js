/**
 * Service koneksi ke MikroTik RouterOS API (node-routeros)
 * Mendukung PPPoE secret & Hotspot user
 */
const { RouterOSAPI } = require('node-routeros');

/**
 * @param {Object} config - { host, port, username, password, is_ssl, use_vpn, vpn_ip }
 * Jika use_vpn dan vpn_ip ada, koneksi pakai vpn_ip (VPN Radius).
 * @returns {Promise<RouterOSAPI>}
 */
function connect(config) {
  const host = config.use_vpn && config.vpn_ip ? config.vpn_ip : config.host;
  const api = new RouterOSAPI({
    host,
    port: config.port || 8728,
    user: config.username,
    password: config.password,
    tls: config.is_ssl ? {} : undefined,
  });
  return api.connect().then(() => api);
}

/**
 * PPPoE: tambah secret (pelanggan)
 */
async function addPppoeSecret(api, username, password, comment = '') {
  const params = ['/ppp/secret/add', '=name=' + username, '=password=' + password];
  if (comment) params.push('=comment=' + comment);
  return api.write(params);
}

/**
 * PPPoE: hapus secret
 */
async function removePppoeSecret(api, username) {
  const list = await api.write(['/ppp/secret/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ppp/secret/remove', '=numbers=' + item['.id']]);
  }
}

/**
 * PPPoE: disable (isolir)
 */
async function disablePppoeSecret(api, username) {
  const list = await api.write(['/ppp/secret/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ppp/secret/disable', '=numbers=' + item['.id']]);
  }
}

/**
 * PPPoE: enable (aktifkan)
 */
async function enablePppoeSecret(api, username) {
  const list = await api.write(['/ppp/secret/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ppp/secret/enable', '=numbers=' + item['.id']]);
  }
}

/**
 * Hotspot: tambah user
 */
async function addHotspotUser(api, username, password, comment = '') {
  const params = ['/ip/hotspot/user/add', '=name=' + username, '=password=' + password];
  if (comment) params.push('=comment=' + comment);
  return api.write(params);
}

/**
 * Hotspot: hapus user
 */
async function removeHotspotUser(api, username) {
  const list = await api.write(['/ip/hotspot/user/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ip/hotspot/user/remove', '=numbers=' + item['.id']]);
  }
}

/**
 * Hotspot: disable user
 */
async function disableHotspotUser(api, username) {
  const list = await api.write(['/ip/hotspot/user/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ip/hotspot/user/disable', '=numbers=' + item['.id']]);
  }
}

/**
 * Hotspot: enable user
 */
async function enableHotspotUser(api, username) {
  const list = await api.write(['/ip/hotspot/user/print', '?name=' + username]);
  const item = Array.isArray(list) ? list[0] : list;
  if (item && item['.id']) {
    return api.write(['/ip/hotspot/user/enable', '=numbers=' + item['.id']]);
  }
}

/**
 * Hotspot: tambah voucher (user dengan limit)
 */
async function addHotspotVoucher(api, code, password, limitBytesOrProfile) {
  const params = ['/ip/hotspot/user/add', '=name=' + code, '=password=' + password];
  if (limitBytesOrProfile) params.push('=limit-bytes=' + limitBytesOrProfile);
  return api.write(params);
}

async function getActiveSessions(api) {
  const [ppp, hotspot] = await Promise.all([
    api.write(['/ppp/active/print']),
    api.write(['/ip/hotspot/active/print']),
  ]);
  return {
    pppActive: Array.isArray(ppp) ? ppp.length : 0,
    hotspotActive: Array.isArray(hotspot) ? hotspot.length : 0,
  };
}

module.exports = {
  connect,
  addPppoeSecret,
  removePppoeSecret,
  disablePppoeSecret,
  enablePppoeSecret,
  addHotspotUser,
  removeHotspotUser,
  disableHotspotUser,
  enableHotspotUser,
  addHotspotVoucher,
  getActiveSessions,
};
