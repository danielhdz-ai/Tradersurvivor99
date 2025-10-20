const http = require('http');
const url = require('url');

const PROXY = process.env.PROXY_URL || 'http://127.0.0.1:8003';

function checkHealth() {
  return new Promise((resolve) => {
    const u = new URL('/health', PROXY);
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + (u.search || ''),
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(opts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ ok: true, statusCode: res.statusCode, body }));
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.end();
  });
}

(async () => {
  console.log('Using PROXY:', PROXY);
  const h = await checkHealth();
  if (!h.ok) {
    console.error('Health check FAILED:', h.error || h);
    process.exitCode = 2;
    return;
  }

  console.log('Health check OK - status:', h.statusCode);
  try {
    const parsed = JSON.parse(h.body);
    console.log('Body JSON:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Body (raw):', h.body);
  }
})();
