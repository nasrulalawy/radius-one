// Supabase Edge Function: Disconnect user on MikroTik (hotspot active remove)
// GET /rest/ip/hotspot/active, find by user or address, then DELETE by .id
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function restFetch(
  restBase: string,
  auth: string,
  path: string,
  method: 'GET' | 'DELETE' = 'GET'
): Promise<Response> {
  const url = restBase + path
  return fetch(url, {
    method,
    headers: { Authorization: auth },
    signal: AbortSignal.timeout(10000),
  })
}

function getRestBase(host: string, port?: number, protocol = 'https'): string {
  const p = port === 443 || port === 80 ? '' : ':' + port
  return `${protocol}://${host}${p}/rest`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const sessionId = body.session_id as string | undefined
    const nasId = body.nas_id as string | undefined
    const username = body.username as string | undefined

    if (!sessionId && !nasId) {
      return new Response(JSON.stringify({ ok: false, message: 'Berikan session_id atau nas_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let nas: { nasname: string; api_username: string | null; api_password: string | null }
    let targetUser: string
    let targetIp: string | null = null

    if (sessionId) {
      const { data: session, error: sessErr } = await supabase
        .from('sessions')
        .select('username, framed_ip, nas_id')
        .eq('id', sessionId)
        .single()
      if (sessErr || !session) {
        return new Response(JSON.stringify({ ok: false, message: 'Session tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (!session.nas_id) {
        await supabase.from('sessions').delete().eq('id', sessionId)
        return new Response(JSON.stringify({ ok: true, message: 'Sesi dihapus (tanpa NAS)' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: nasRow, error: nasErr } = await supabase
        .from('nas_devices')
        .select('nasname, api_username, api_password')
        .eq('id', session.nas_id)
        .single()
      if (nasErr || !nasRow) {
        return new Response(JSON.stringify({ ok: false, message: 'NAS tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      nas = nasRow
      targetUser = session.username
      targetIp = session.framed_ip
    } else {
      const uname = username || body.user
      if (!uname) {
        return new Response(JSON.stringify({ ok: false, message: 'Berikan username' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: nasRow, error: nasErr } = await supabase
        .from('nas_devices')
        .select('nasname, api_username, api_password')
        .eq('id', nasId)
        .single()
      if (nasErr || !nasRow) {
        return new Response(JSON.stringify({ ok: false, message: 'NAS tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      nas = nasRow
      targetUser = uname
    }

    const cleanAddress = nas.nasname.replace(/^https?:\/\//, '').split('/')[0].trim()
    const [host, portFromAddr] = cleanAddress.includes(':') ? cleanAddress.split(':') : [cleanAddress, '']
    const portsToTry = portFromAddr ? [parseInt(portFromAddr, 10)] : [443, 80, 8080]
    const auth = 'Basic ' + base64Encode(`${nas.api_username || 'admin'}:${nas.api_password || ''}`)

    for (const protocol of ['https', 'http']) {
      for (const port of portsToTry) {
        const restBase = getRestBase(host, port, protocol as 'https' | 'http')
        try {
          const listRes = await restFetch(restBase, auth, '/ip/hotspot/active', 'GET')
          if (!listRes.ok) continue
          const list = (await listRes.json()) as Array<{ '.id': string; user?: string; address?: string }>
          const match = list.find(
            (a) =>
              (a.user && a.user.toLowerCase() === targetUser.toLowerCase()) ||
              (targetIp && a.address === targetIp)
          )
          if (match && match['.id']) {
            const idEnc = encodeURIComponent(match['.id'])
            const delRes = await restFetch(restBase, auth, `/ip/hotspot/active/${idEnc}`, 'DELETE')
            if (delRes.ok || delRes.status === 204) {
              await supabase.from('sessions').delete().eq('id', sessionId!)
              return new Response(
                JSON.stringify({ ok: true, message: 'User telah diputus di MikroTik (hotspot)' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
        } catch {
          // try next
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: false,
        message: 'User tidak ditemukan di hotspot active atau router tidak terjangkau. Coba PPPoE jika pakai PPPoE.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
