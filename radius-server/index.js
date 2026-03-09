/**
 * RADIUS Server for RadiusOne - Auth (1812) & Accounting (1813) via Supabase
 * Run on Ubuntu (e.g. Tencent Lighthouse). Open UDP 1812, 1813.
 */
require('dotenv').config()
const dgram = require('dgram')
const radius = require('radius')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Cache NAS by nasname for secret lookup (refresh periodically)
let nasList = []
async function loadNas() {
  const { data } = await supabase.from('nas_devices').select('id, nasname, secret')
  nasList = (data || []).filter((n) => n.secret)
}
function getSecret(clientIp, nasIpFromPacket) {
  const ip = nasIpFromPacket || clientIp
  const n = nasList.find((n) => n.nasname === ip || n.nasname === clientIp)
  return n ? { secret: n.secret, nasId: n.id } : null
}

// ---------- AUTH (port 1812) ----------
const authSocket = dgram.createSocket('udp4')
authSocket.on('message', async (msg, rinfo) => {
  let decoded
  let secretInfo = getSecret(rinfo.address, null)
  if (!secretInfo) {
    try {
      const pre = radius.decode_without_secret({ packet: msg })
      if (pre && pre.attributes) {
        const nasIp = pre.attributes['NAS-IP-Address'] || rinfo.address
        secretInfo = getSecret(rinfo.address, nasIp)
      }
    } catch (_) {}
  }
  if (!secretInfo) {
    console.log('Auth: no NAS for', rinfo.address)
    return
  }
  try {
    decoded = radius.decode({ packet: msg, secret: secretInfo.secret })
  } catch (e) {
    console.log('Auth: decode fail', rinfo.address, e.message)
    return
  }
  if (decoded.code !== 'Access-Request') return

  const username = (decoded.attributes['User-Name'] || '').trim()
  const password = decoded.attributes['User-Password'] || ''

  if (!username) {
    sendReject(decoded, secretInfo.secret, rinfo)
    return
  }

  const { data: user } = await supabase
    .from('radius_users')
    .select('id, password, status, expiry_date')
    .eq('username', username)
    .maybeSingle()

  let accept = false
  if (user) {
    if (user.status !== 'active') accept = false
    else if (user.expiry_date && new Date(user.expiry_date) < new Date()) accept = false
    else if (user.password === password) accept = true
  }

  const response = radius.encode_response({
    packet: decoded,
    code: accept ? 'Access-Accept' : 'Access-Reject',
    secret: secretInfo.secret,
  })
  authSocket.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
    if (err) console.error('Auth send', err)
  })
  console.log(accept ? 'Accept' : 'Reject', username, rinfo.address)
})

function sendReject(decoded, secret, rinfo) {
  const response = radius.encode_response({
    packet: decoded,
    code: 'Access-Reject',
    secret,
  })
  authSocket.send(response, 0, response.length, rinfo.port, rinfo.address)
}

// ---------- ACCOUNTING (port 1813) ----------
const acctSocket = dgram.createSocket('udp4')
acctSocket.on('message', async (msg, rinfo) => {
  let secretInfo = getSecret(rinfo.address, null)
  if (!secretInfo) {
    try {
      const pre = radius.decode_without_secret({ packet: msg })
      const nasIp = (pre && pre.attributes && pre.attributes['NAS-IP-Address']) || rinfo.address
      secretInfo = getSecret(rinfo.address, nasIp)
    } catch {}
  }
  if (!secretInfo) {
    console.log('Acct: no NAS for', rinfo.address)
    sendAcctResp(msg, rinfo, null)
    return
  }
  let decoded
  try {
    decoded = radius.decode({ packet: msg, secret: secretInfo.secret })
  } catch (e) {
    console.log('Acct: decode fail', rinfo.address)
    sendAcctResp(msg, rinfo, secretInfo.secret)
    return
  }
  if (decoded.code !== 'Accounting-Request') {
    sendAcctResp(msg, rinfo, secretInfo.secret)
    return
  }

  const status = decoded.attributes['Acct-Status-Type'] // Start, Stop, Interim-Update
  const username = (decoded.attributes['User-Name'] || '').trim()
  const sessionId = decoded.attributes['Acct-Session-Id'] || decoded.attributes['Acct-Unique-Session-Id'] || ''
  const framedIp = decoded.attributes['Framed-IP-Address'] || null
  const inputOctets = parseInt(decoded.attributes['Acct-Input-Octets'] || '0', 10)
  const outputOctets = parseInt(decoded.attributes['Acct-Output-Octets'] || '0', 10)

  const { data: user } = await supabase.from('radius_users').select('id').eq('username', username).maybeSingle()
  const userId = user ? user.id : null

  if (status === 'Start') {
    await supabase.from('sessions').insert({
      username,
      user_id: userId,
      nas_id: secretInfo.nasId,
      framed_ip: framedIp,
      session_id: sessionId,
      data_in: inputOctets,
      data_out: outputOctets,
    })
  } else if (status === 'Stop' || status === 'Interim-Update') {
    const { data: existing } = await supabase
      .from('sessions')
      .select('id, user_id, data_in, data_out')
      .eq('session_id', sessionId)
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      const totalIn = (existing.data_in || 0) + inputOctets
      const totalOut = (existing.data_out || 0) + outputOctets
      await supabase
        .from('sessions')
        .update({
          data_in: totalIn,
          data_out: totalOut,
          ...(status === 'Stop' ? { terminate_cause: decoded.attributes['Acct-Terminate-Cause'] || null } : {}),
        })
        .eq('id', existing.id)

      if (status === 'Stop' && existing.user_id) {
        const addMb = Math.ceil((inputOctets + outputOctets) / (1024 * 1024))
        const { data: u } = await supabase.from('radius_users').select('data_used_mb').eq('id', existing.user_id).single()
        const current = (u && u.data_used_mb) || 0
        await supabase.from('radius_users').update({ data_used_mb: current + addMb }).eq('id', existing.user_id)
      }
    } else if (status === 'Interim-Update') {
      await supabase.from('sessions').insert({
        username,
        user_id: userId,
        nas_id: secretInfo.nasId,
        framed_ip: framedIp,
        session_id: sessionId,
        data_in: inputOctets,
        data_out: outputOctets,
      })
    }
  }

  sendAcctResp(msg, rinfo, secretInfo.secret)
  console.log('Acct', status, username, sessionId, rinfo.address)
})

function sendAcctResp(requestMsg, rinfo, secret) {
  if (!secret) return
  try {
    const decoded = radius.decode({ packet: requestMsg, secret })
    const response = radius.encode_response({
      packet: decoded,
      code: 'Accounting-Response',
      secret,
    })
    acctSocket.send(response, 0, response.length, rinfo.port, rinfo.address)
  } catch (_) {}
}

// ---------- Start ----------
async function main() {
  await loadNas()
  setInterval(loadNas, 60000)

  authSocket.bind(1812, () => {
    console.log('RADIUS auth listening on UDP 1812')
  })
  acctSocket.bind(1813, () => {
    console.log('RADIUS accounting listening on UDP 1813')
  })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
