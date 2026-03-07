const { createClient } = require('@supabase/supabase-js');

function isEnabled() {
  return true;
}

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Env ${name} wajib diisi`);
  return val;
}

let authClient;
let adminClient;

function getAuthClient() {
  if (authClient) return authClient;
  const url = required('SUPABASE_URL');
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('SUPABASE_ANON_KEY atau SUPABASE_SERVICE_KEY wajib diisi untuk Supabase Auth');
  authClient = createClient(url, key);
  return authClient;
}

function getAdminClient() {
  if (adminClient) return adminClient;
  const url = required('SUPABASE_URL');
  const key = required('SUPABASE_SERVICE_KEY');
  adminClient = createClient(url, key);
  return adminClient;
}

function isMissingColumn(error, columnName) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes(`column users.${String(columnName).toLowerCase()} does not exist`);
}

async function loadAdminProfileByAuth(userId, email) {
  const sb = getAdminClient();
  let result = await sb.from('users').select('*').eq('auth_user_id', userId).maybeSingle();
  if (result.error && !isMissingColumn(result.error, 'auth_user_id')) throw new Error(result.error.message);
  if (!result.error && result.data) return result.data;

  result = await sb.from('users').select('*').eq('email', email).maybeSingle();
  if (result.error && !isMissingColumn(result.error, 'email')) throw new Error(result.error.message);
  if (result.error && isMissingColumn(result.error, 'email')) {
    // Legacy schema fallback: cari dari username saat kolom email belum ada.
    result = await sb.from('users').select('*').eq('username', String(email || '').split('@')[0]).maybeSingle();
    if (result.error) throw new Error(result.error.message);
  }
  if (!result.data) return null;

  if (!result.data.auth_user_id) {
    const upd = await sb.from('users').update({ auth_user_id: userId }).eq('id', result.data.id).select().single();
    if (!upd.error) return upd.data;
    if (!isMissingColumn(upd.error, 'auth_user_id')) throw new Error(upd.error.message);
  }
  return result.data;
}

async function signInAdmin(email, password) {
  const rawLogin = String(email || '').trim();
  let loginEmail = rawLogin.toLowerCase();
  if (!loginEmail.includes('@')) {
    const sb = getAdminClient();
    let byUsername = await sb.from('users').select('email').eq('username', rawLogin).maybeSingle();
    if (byUsername.error || !byUsername.data?.email) {
      // Lebih toleran untuk input username dengan perbedaan huruf besar/kecil.
      byUsername = await sb.from('users').select('email').ilike('username', rawLogin).maybeSingle();
    }
    if (!byUsername.error && byUsername.data?.email) loginEmail = String(byUsername.data.email).toLowerCase();
  }
  const client = getAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: loginEmail,
    password: String(password || ''),
  });
  if (error || !data?.user || !data?.session) return null;

  const profile = await loadAdminProfileByAuth(data.user.id, loginEmail);
  if (!profile || !profile.role || !['admin', 'owner', 'staff'].includes(profile.role)) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username || loginEmail,
    role: profile.role,
    email: profile.email || loginEmail,
    auth_user_id: data.user.id,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}

async function listAdminUsers() {
  const sb = getAdminClient();
  let { data, error } = await sb
    .from('users')
    .select('id,username,email,role,created_at,auth_user_id')
    .in('role', ['admin', 'owner', 'staff'])
    .order('id', { ascending: true });
  if (error && (isMissingColumn(error, 'email') || isMissingColumn(error, 'auth_user_id'))) {
    const fallback = await sb
      .from('users')
      .select('id,username,role,created_at')
      .in('role', ['admin', 'owner', 'staff'])
      .order('id', { ascending: true });
    data = (fallback.data || []).map((u) => ({ ...u, email: '', auth_user_id: null }));
    error = fallback.error;
  }
  if (error) throw new Error(error.message);
  return data || [];
}

async function createAdminUser({ email, password, username, role }) {
  const sb = getAdminClient();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) throw new Error('Email dan password wajib diisi.');
  const selectedRole = role || 'admin';

  let authUser = null;
  const created = await sb.auth.admin.createUser({
    email: normalizedEmail,
    password: String(password),
    email_confirm: true,
  });
  if (created.error) {
    if (String(created.error.message || '').toLowerCase().includes('already')) {
      const listed = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw new Error(listed.error.message);
      authUser = (listed.data?.users || []).find((u) => String(u.email || '').toLowerCase() === normalizedEmail) || null;
    } else {
      throw new Error(created.error.message);
    }
  } else {
    authUser = created.data.user;
  }
  if (!authUser) throw new Error('Gagal membuat user auth Supabase.');

  // Pastikan password auth sinkron dengan input terbaru (mis. ADMIN_PASS saat bootstrap).
  const updatedAuth = await sb.auth.admin.updateUserById(authUser.id, {
    password: String(password),
    email_confirm: true,
  });
  if (updatedAuth.error) throw new Error(updatedAuth.error.message);
  authUser = updatedAuth.data?.user || authUser;

  let existing = await sb.from('users').select('*').eq('email', normalizedEmail).maybeSingle();
  if (existing.error && isMissingColumn(existing.error, 'email')) {
    existing = await sb.from('users').select('*').eq('username', username || normalizedEmail).maybeSingle();
  }
  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    let payload = {
      username: username || existing.data.username || normalizedEmail,
      role: selectedRole,
      auth_user_id: authUser.id,
      email: normalizedEmail,
    };
    let upd = await sb.from('users').update(payload).eq('id', existing.data.id).select().single();
    if (upd.error && (isMissingColumn(upd.error, 'auth_user_id') || isMissingColumn(upd.error, 'email'))) {
      payload = {
        username: payload.username,
        role: payload.role,
      };
      upd = await sb.from('users').update(payload).eq('id', existing.data.id).select().single();
    }
    if (upd.error) throw new Error(upd.error.message);
    return upd.data;
  }

  let ins = await sb
    .from('users')
    .insert({
      username: username || normalizedEmail,
      email: normalizedEmail,
      role: selectedRole,
      auth_user_id: authUser.id,
      password_hash: '',
    })
    .select()
    .single();
  if (ins.error && (isMissingColumn(ins.error, 'auth_user_id') || isMissingColumn(ins.error, 'email'))) {
    ins = await sb
      .from('users')
      .insert({
        username: username || normalizedEmail,
        role: selectedRole,
        password_hash: '',
      })
      .select()
      .single();
  }
  if (ins.error) throw new Error(ins.error.message);
  return ins.data;
}

async function bootstrapAdmin({ username, email, password }) {
  try {
    if (!email || !password) return null;
    // Selalu sinkronkan akun admin default agar password ENV tetap berlaku.
    return createAdminUser({ username: username || 'admin', email, password, role: 'admin' });
  } catch (e) {
    return null;
  }
}

module.exports = {
  isEnabled,
  signInAdmin,
  listAdminUsers,
  createAdminUser,
  bootstrapAdmin,
};
