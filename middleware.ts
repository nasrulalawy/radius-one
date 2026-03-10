const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

const ALLOWED = ['mikrotik-test', 'mikrotik-check-all', 'mikrotik-disconnect']

export const config = {
  matcher: ['/api/mikrotik-proxy'],
}

export default async function middleware(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(request.url)
  const fn = url.searchParams.get('fn')
  if (!fn || !ALLOWED.includes(fn)) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Missing or invalid ?fn=' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Server: missing Supabase env' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const base = SUPABASE_URL.replace(/\/$/, '')
  const body = fn === 'mikrotik-check-all' ? '{}' : await request.text()
  const res = await fetch(`${base}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body || '{}',
  })
  const data = await res.text()
  return new Response(data, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
