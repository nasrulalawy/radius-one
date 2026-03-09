// Supabase Edge Function: Check all MikroTik routers and update ping_status
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

async function testOne(
  address: string,
  apiUsername: string,
  apiPassword: string
): Promise<'online' | 'timeout'> {
  const cleanAddress = address.replace(/^https?:\/\//, '').split('/')[0].trim()
  const [host, portFromAddr] = cleanAddress.includes(':') ? cleanAddress.split(':') : [cleanAddress, '']
  const user = apiUsername || 'admin'
  const pass = apiPassword || ''
  const auth = 'Basic ' + base64Encode(`${user}:${pass}`)
  const portsToTry = portFromAddr ? [parseInt(portFromAddr, 10)] : [443, 80, 8080]
  const protocols = ['https', 'http']

  for (const protocol of protocols) {
    for (const port of portsToTry) {
      const baseUrl = `${protocol}://${host}${port === 443 || port === 80 ? '' : ':' + port}/rest/system/resource`
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(baseUrl, { method: 'GET', headers: { Authorization: auth }, signal: controller.signal })
        clearTimeout(timeout)
        if (res.ok) return 'online'
      } catch {
        // try next
      }
    }
  }
  return 'timeout'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: rows, error } = await supabase
      .from('nas_devices')
      .select('id, nasname, api_username, api_password, type')
      .eq('type', 'mikrotik')

    if (error) {
      return new Response(JSON.stringify({ ok: false, message: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date().toISOString()
    const results: { id: string; status: string }[] = []

    for (const row of rows || []) {
      const status = await testOne(row.nasname, row.api_username || 'admin', row.api_password || '')
      await supabase.from('nas_devices').update({ ping_status: status, last_checked: now }).eq('id', row.id)
      results.push({ id: row.id, status })
    }

    return new Response(
      JSON.stringify({ ok: true, checked: results.length, results, last_checked: now }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
