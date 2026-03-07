/**
 * Bootstrap admin Supabase Auth
 */
require('dotenv').config();
const supabaseAuth = require('../services/supabaseAuth');

const adminUser = process.env.ADMIN_USER || 'admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@radiusone.local';
const adminPass = process.env.ADMIN_PASS || 'admin123';

(async () => {
  await supabaseAuth.bootstrapAdmin({
    username: adminUser,
    email: adminEmail,
    password: adminPass,
  });
  console.log('Supabase auth bootstrap selesai.');
})().catch((e) => {
  console.error('Supabase bootstrap admin gagal:', e.message);
  process.exitCode = 1;
});
