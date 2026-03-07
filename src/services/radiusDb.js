/**
 * Sinkronisasi user ke database FreeRADIUS (SQL).
 * Backend didukung:
 * - supabase (default)
 * - mysql
 */
const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

let pool;
let supabase;

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Env ${name} wajib diisi untuk mode RADIUS`);
  return val;
}

function getBackend() {
  if (process.env.RADIUS_BACKEND) return process.env.RADIUS_BACKEND.toLowerCase();
  return 'supabase';
}

function tablePrefix() {
  return process.env.RADIUS_DB_TABLE_PREFIX || 'rad';
}

function mysqlTable(name) {
  return `\`${tablePrefix()}${name}\``;
}

function supaTable(name) {
  return `${tablePrefix()}${name}`;
}

function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: required('RADIUS_DB_HOST'),
    port: parseInt(process.env.RADIUS_DB_PORT || '3306', 10),
    user: required('RADIUS_DB_USER'),
    password: process.env.RADIUS_DB_PASS || '',
    database: required('RADIUS_DB_NAME'),
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.RADIUS_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.RADIUS_SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_KEY (atau RADIUS_SUPABASE_*) wajib diisi untuk RADIUS backend supabase');
  }
  supabase = createClient(url, key);
  return supabase;
}

function ensureOk(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function pingMySql() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

async function pingSupabase() {
  const sb = getSupabase();
  const { error } = await sb.from(supaTable('check')).select('id').limit(1);
  ensureOk(error, 'RADIUS Supabase ping');
}

async function ping() {
  if (getBackend() === 'supabase') return pingSupabase();
  return pingMySql();
}

async function upsertCustomerMySql(customer) {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `DELETE FROM ${mysqlTable('check')} WHERE username = ? AND attribute = 'Cleartext-Password'`,
      [customer.username]
    );
    await conn.query(
      `INSERT INTO ${mysqlTable('check')} (username, attribute, op, value) VALUES (?, 'Cleartext-Password', ':=', ?)`,
      [customer.username, customer.password || '']
    );
    await conn.query(
      `DELETE FROM ${mysqlTable('reply')} WHERE username = ? AND attribute = 'Auth-Type'`,
      [customer.username]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function upsertCustomerSupabase(customer) {
  const sb = getSupabase();
  let result = await sb
    .from(supaTable('check'))
    .delete()
    .eq('username', customer.username)
    .eq('attribute', 'Cleartext-Password');
  ensureOk(result.error, 'RADIUS delete radcheck');

  result = await sb.from(supaTable('check')).insert({
    username: customer.username,
    attribute: 'Cleartext-Password',
    op: ':=',
    value: customer.password || '',
  });
  ensureOk(result.error, 'RADIUS insert radcheck');

  result = await sb
    .from(supaTable('reply'))
    .delete()
    .eq('username', customer.username)
    .eq('attribute', 'Auth-Type');
  ensureOk(result.error, 'RADIUS clear reject');
}

async function upsertCustomer(customer) {
  if (getBackend() === 'supabase') return upsertCustomerSupabase(customer);
  return upsertCustomerMySql(customer);
}

async function isolateCustomerMySql(username) {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `DELETE FROM ${mysqlTable('reply')} WHERE username = ? AND attribute = 'Auth-Type'`,
      [username]
    );
    await conn.query(
      `INSERT INTO ${mysqlTable('reply')} (username, attribute, op, value) VALUES (?, 'Auth-Type', ':=', 'Reject')`,
      [username]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function isolateCustomerSupabase(username) {
  const sb = getSupabase();
  let result = await sb
    .from(supaTable('reply'))
    .delete()
    .eq('username', username)
    .eq('attribute', 'Auth-Type');
  ensureOk(result.error, 'RADIUS clear reply');

  result = await sb.from(supaTable('reply')).insert({
    username,
    attribute: 'Auth-Type',
    op: ':=',
    value: 'Reject',
  });
  ensureOk(result.error, 'RADIUS set reject');
}

async function isolateCustomer(username) {
  if (getBackend() === 'supabase') return isolateCustomerSupabase(username);
  return isolateCustomerMySql(username);
}

async function activateCustomerMySql(username) {
  const p = getPool();
  await p.query(
    `DELETE FROM ${mysqlTable('reply')} WHERE username = ? AND attribute = 'Auth-Type'`,
    [username]
  );
}

async function activateCustomerSupabase(username) {
  const sb = getSupabase();
  const { error } = await sb
    .from(supaTable('reply'))
    .delete()
    .eq('username', username)
    .eq('attribute', 'Auth-Type');
  ensureOk(error, 'RADIUS activate clear reject');
}

async function activateCustomer(username) {
  if (getBackend() === 'supabase') return activateCustomerSupabase(username);
  return activateCustomerMySql(username);
}

module.exports = {
  ping,
  upsertCustomer,
  isolateCustomer,
  activateCustomer,
};

