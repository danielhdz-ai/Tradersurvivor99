const axios = require('axios');
const crypto = require('crypto');

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:8003';
const API_KEY = process.env.BITGET_API_KEY || '';
const SECRET = process.env.BITGET_SECRET || '';
const PASSPHRASE = process.env.BITGET_PASSPHRASE || '';
const USE_PROXY = process.env.USE_PROXY !== 'false'; // default true

if (!API_KEY || !SECRET || !PASSPHRASE) {
  console.error('Faltan credenciales. Exporta BITGET_API_KEY, BITGET_SECRET y BITGET_PASSPHRASE como variables de entorno.');
  process.exit(2);
}

// Test endpoint for futures (mix) trade fills
const API_PREFIX = process.env.BITGET_API_PREFIX || '/api/mix/v1';
const endpoint = `${API_PREFIX}/trade/fills`;

function generateSignature(timestamp, method, requestPath, body) {
  const prehash = `${timestamp}${method}${requestPath}${body || ''}`;
  return crypto.createHmac('sha256', SECRET).update(prehash).digest('base64');
}

async function tryProxy() {
  try {
    const url = `${PROXY}/bitget${endpoint}`;
    console.log('Probando vía proxy:', url);
    const headers = {
      'X-API-KEY': API_KEY,
      'X-SECRET-KEY': SECRET,
      'X-PASSPHRASE': PASSPHRASE,
      'Content-Type': 'application/json'
    };
    const resp = await axios.get(url, { headers, timeout: 8000 });
    console.log('--- Proxy response status:', resp.status);
    console.log('--- Proxy response data:', JSON.stringify(resp.data, null, 2));
    return { ok: true, via: 'proxy' };
  } catch (err) {
    console.error('Proxy request failed:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', JSON.stringify(err.response.data, null, 2));
    }
    return { ok: false, error: err };
  }
}

async function tryDirect() {
  try {
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = `${endpoint}`;
    const signature = generateSignature(timestamp, method, requestPath, '');
    const url = `https://api.bitget.com${requestPath}`;

    console.log('Probando directa:', url);
    const headers = {
      'ACCESS-KEY': API_KEY,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': PASSPHRASE,
      'Content-Type': 'application/json'
    };

    const resp = await axios.get(url, { headers, timeout: 8000 });
    console.log('--- Direct response status:', resp.status);
    console.log('--- Direct response data:', JSON.stringify(resp.data, null, 2));
    return { ok: true, via: 'direct' };
  } catch (err) {
    console.error('Direct request failed:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Body:', JSON.stringify(err.response.data, null, 2));
    }
    return { ok: false, error: err };
  }
}

(async () => {
  console.log('Using PROXY:', PROXY, 'USE_PROXY=', USE_PROXY);
  if (USE_PROXY) {
    const p = await tryProxy();
    if (p.ok) return;
    console.log('Fallo proxy, intentando llamada directa...');
  }
  const d = await tryDirect();
  if (!d.ok) process.exitCode = 3;
})();
