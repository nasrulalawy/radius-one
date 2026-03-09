const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

const ALLOWED = ['mikrotik-test', 'mikrotik-check-all', 'mikrotik-disconnect'] as const

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ ok: false, message: 'Server: missing Supabase env' }, 500)
  }
  const url = new URL(request.url)
  const fn = url.searchParams.get('fn') as typeof ALLOWED[number] | null
  if (!fn || !ALLOWED.includes(fn)) {
    return jsonResponse({ ok: false, message: 'Missing or invalid ?fn= (mikrotik-test | mikrotik-check-all | mikrotik-disconnect)' }, 400)
  }
  const body = fn === 'mikrotik-check-all' ? '{}' : JSON.stringify(await request.json().catch(() => ({})))
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  })
  const data = await res.json().catch(() => ({ ok: false, message: 'Invalid response' }))
  return jsonResponse(data, res.status)
}
