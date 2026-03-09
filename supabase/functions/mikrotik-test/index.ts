// Supabase Edge Function: Test MikroTik connection via REST API
// RouterOS 7.x: enable www or www-ssl service, then GET /rest/system/resource with Basic Auth
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function testMikrotikREST(
  address: string,
  apiUsername: string,
  apiPassword: string,
  apiPort?: number
): Promise<{ ok: boolean; status: 'online' | 'timeout'; message: string; detail?: unknown }> {
  const cleanAddress = address.replace(/^https?:\/\//, '').split('/')[0].trim()
  const [host, portFromAddr] = cleanAddress.includes(':') ? cleanAddress.split(':') : [cleanAddress, '']
  const user = apiUsername || 'admin'
  const pass = apiPassword || ''
  const auth = 'Basic ' + base64Encode(`${user}:${pass}`)

  // REST API is on www (80) or www-ssl (443), not 8728. Try HTTPS first, then HTTP.
  const portsToTry = portFromAddr ? [parseInt(portFromAddr, 10)] : [443, 80, 8080]
  const protocols = ['https', 'http']

  for (const protocol of protocols) {
    for (const port of portsToTry) {
      const baseUrl = `${protocol}://${host}${port === 443 || port === 80 ? '' : ':' + port}/rest/system/resource`
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        const res = await fetch(baseUrl, {
          method: 'GET',
          headers: { Authorization: auth },
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (res.ok) {
          const data = await res.json()
          return { ok: true, status: 'online', message: 'RouterOS REST API OK', detail: data }
        }
        if (res.status === 401) {
          return { ok: false, status: 'timeout', message: 'Auth gagal (401). Cek API Username & Password.' }
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          return { ok: false, status: 'timeout', message: 'Timeout. Router tidak merespons.' }
        }
        // continue to next URL
      }
    }
  }

  return { ok: false, status: 'timeout', message: 'Tidak dapat terhubung. Pastikan: (1) RouterOS 7+ dengan www/www-ssl aktif, (2) IP/host dapat diakses dari internet.' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const nasId = body.nas_id as string | undefined
    const address = body.address as string | undefined
    const apiUsername = body.api_username as string | undefined
    const apiPassword = body.api_password as string | undefined
    const apiPort = body.api_port as number | undefined

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    let nasname: string
    let username: string
    let password: string
    let updateId: string | null = null

    if (nasId) {
      const { data: row, error } = await supabase.from('nas_devices').select('id, nasname, api_username, api_password').eq('id', nasId).single()
      if (error || !row) {
        return new Response(JSON.stringify({ ok: false, message: 'NAS tidak ditemukan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      nasname = row.nasname
      username = row.api_username || 'admin'
      password = row.api_password || ''
      updateId = row.id
    } else if (address) {
      nasname = address
      username = apiUsername || 'admin'
      password = apiPassword || ''
    } else {
      return new Response(JSON.stringify({ ok: false, message: 'Berikan nas_id atau address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await testMikrotikREST(nasname, username, password, apiPort)
    const now = new Date().toISOString()

    if (updateId) {
      await supabase
        .from('nas_devices')
        .update({ ping_status: result.status, last_checked: now })
        .eq('id', updateId)
    }

    return new Response(
      JSON.stringify({
        ok: result.ok,
        status: result.status,
        message: result.message,
        detail: result.detail,
        last_checked: now,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
