const db = require('../db');

function normalizeNetwork(network) {
  const raw = String(network || '').trim();
  if (!raw) return '10.99.0.0/24';
  return raw.includes('/') ? raw : `${raw}/24`;
}

function normalizeProfile(row) {
  return {
    id: String(row.id || ''),
    name: String(row.name || '').trim(),
    server_endpoint: String(row.server_endpoint || '').trim(),
    server_public_key: String(row.server_public_key || '').trim(),
    vpn_network: normalizeNetwork(row.vpn_network),
  };
}

function makeId() {
  return `vpn_${Date.now().toString(36)}`;
}

function getRaw() {
  return db.getAppSettings ? db.getAppSettings() : {};
}

function fallbackEnvProfile() {
  const endpoint = process.env.VPN_SERVER_ENDPOINT || '';
  const pub = process.env.VPN_SERVER_PUBLIC_KEY || '';
  const network = process.env.VPN_NETWORK || '10.99.0.0/24';
  if (!endpoint && !pub) return null;
  return {
    id: 'env-default',
    name: 'Default (ENV)',
    server_endpoint: endpoint,
    server_public_key: pub,
    vpn_network: normalizeNetwork(network),
  };
}

function getProfiles() {
  const raw = getRaw();
  let list = [];
  try {
    list = JSON.parse(raw.vpn_profiles_json || '[]');
  } catch (e) {
    list = [];
  }
  list = Array.isArray(list) ? list.map(normalizeProfile).filter((p) => p.id && p.name) : [];
  if (!list.length) {
    const fallback = fallbackEnvProfile();
    if (fallback) list = [fallback];
  }
  return list;
}

function getActiveProfileId() {
  const raw = getRaw();
  const id = String(raw.vpn_active_profile_id || '').trim();
  return id || null;
}

function getActiveProfile() {
  const list = getProfiles();
  if (!list.length) return null;
  const activeId = getActiveProfileId();
  return list.find((p) => p.id === activeId) || list[0];
}

async function persist(profiles, activeId) {
  if (!db.saveAppSettings) throw new Error('saveAppSettings tidak tersedia.');
  await db.saveAppSettings({
    vpn_profiles_json: JSON.stringify(profiles),
    vpn_active_profile_id: activeId || '',
  });
}

function validateProfile(profile) {
  if (!profile.name) throw new Error('Nama profile VPN wajib diisi.');
  if (!profile.server_endpoint) throw new Error('Server endpoint wajib diisi.');
  if (!profile.server_public_key) throw new Error('Server public key wajib diisi.');
  if (!profile.vpn_network) throw new Error('VPN network wajib diisi.');
}

async function addProfile(input) {
  const list = getProfiles().filter((p) => p.id !== 'env-default');
  const profile = normalizeProfile({ ...input, id: makeId() });
  validateProfile(profile);
  list.push(profile);
  const active = getActiveProfileId() || profile.id;
  await persist(list, active);
  return profile;
}

async function setActiveProfile(profileId) {
  const id = String(profileId || '').trim();
  const list = getProfiles();
  const found = list.find((p) => p.id === id);
  if (!found) throw new Error('Profile VPN tidak ditemukan.');
  // Simpan hanya profile non-fallback ke DB
  const persistable = list.filter((p) => p.id !== 'env-default');
  await persist(persistable, id);
}

async function deleteProfile(profileId) {
  const id = String(profileId || '').trim();
  const list = getProfiles().filter((p) => p.id !== 'env-default');
  const next = list.filter((p) => p.id !== id);
  if (next.length === list.length) throw new Error('Profile VPN tidak ditemukan.');
  const activeId = getActiveProfileId();
  const newActive = activeId === id ? (next[0] ? next[0].id : '') : activeId;
  await persist(next, newActive);
}

module.exports = {
  getProfiles,
  getActiveProfileId,
  getActiveProfile,
  addProfile,
  setActiveProfile,
  deleteProfile,
};

