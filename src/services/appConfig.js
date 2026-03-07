const db = require('../db');

const defaultSettings = {
  app_name: 'Radius One',
  company_name: 'Radius One Network',
  company_address: '',
  company_phone: '',
  company_email: '',
  invoice_note: 'Terima kasih atas kepercayaan Anda.',
  currency_symbol: 'Rp',
};

function getSettings() {
  return { ...defaultSettings, ...(db.getAppSettings ? db.getAppSettings() : {}) };
}

async function saveSettings(next) {
  const merged = { ...defaultSettings, ...(next || {}) };
  if (db.saveAppSettings) await db.saveAppSettings(merged);
  return merged;
}

module.exports = {
  getSettings,
  saveSettings,
  defaultSettings,
};
