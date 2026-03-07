/**
 * VPN Radius: generate WireGuard keypair & config untuk router
 * Router connect ke server kita via VPN, lalu kita akses API via IP VPN.
 */
const nacl = require('tweetnacl');
const { randomBytes } = require('crypto');

function base64Encode(buf) {
  return Buffer.from(buf).toString('base64');
}

/**
 * Generate WireGuard key pair (Curve25519, 32 bytes)
 * Returns { privateKey, publicKey } base64
 */
function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    privateKey: base64Encode(keyPair.secretKey),
    publicKey: base64Encode(keyPair.publicKey),
  };
}

/**
 * Parse VPN network e.g. 10.99.0.0/24 -> { base: '10.99.0', prefix: 24 }
 */
function parseVpnNetwork(network) {
  if (!network) return { base: '10.99.0', prefix: 24 };
  const [addr, prefixStr] = network.split('/');
  const prefix = parseInt(prefixStr || '24', 10);
  const parts = addr.split('.');
  const base = parts.slice(0, 3).join('.');
  return { base, prefix };
}

/**
 * Get next free IP in VPN pool (skip .0, .1)
 * Used IPs = existing router vpn_ip + already assigned from pool
 */
function nextVpnIp(usedIps, network) {
  const net = network || process.env.VPN_NETWORK || '10.99.0.0/24';
  const prefix = parseVpnNetwork(net).prefix;
  if (prefix !== 24) {
    // Saat ini alokasi IP otomatis dioptimalkan untuk /24.
    // Prefix lain tetap diterima untuk output config, tetapi alokasi akan pakai oktet terakhir /24.
  }
  const { base } = parseVpnNetwork(net);
  for (let i = 2; i <= 254; i++) {
    const ip = `${base}.${i}`;
    if (!usedIps.includes(ip)) return ip;
  }
  return null;
}

/**
 * Generate WireGuard client config for MikroTik (RouterOS 7)
 * + [Peer] block to add on server
 */
function generateWireGuardConfig(routerName, clientPrivateKey, clientPublicKey, clientVpnIp, serverPublicKey, serverEndpoint, vpnNetwork) {
  const serverEndpointStr = serverEndpoint || process.env.VPN_SERVER_ENDPOINT || 'IP_SERVER:51820';
  const serverPub = serverPublicKey || process.env.VPN_SERVER_PUBLIC_KEY || '';
  const net = vpnNetwork || process.env.VPN_NETWORK || '10.99.0.0/24';
  const { prefix } = parseVpnNetwork(net);

  const clientConfig = `[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${clientVpnIp}/${prefix}

[Peer]
PublicKey = ${serverPub}
Endpoint = ${serverEndpointStr}
AllowedIPs = ${net}
PersistentKeepalive = 25
`;

  const serverPeerBlock = `[Peer]
# Tambahkan ke config WireGuard SERVER (wg0) lalu: wg addconf wg0 <(echo "...")
PublicKey = ${clientPublicKey}
AllowedIPs = ${clientVpnIp}/32
`;

  return { clientConfig, serverPeerBlock };
}

module.exports = {
  generateKeyPair,
  nextVpnIp,
  generateWireGuardConfig,
  parseVpnNetwork,
};
