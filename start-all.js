const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PROXY_HOST = process.env.PROXY_URL || 'http://127.0.0.1:8003';
const PROXY_HEALTH = new URL('/health', PROXY_HOST).toString();
const PROXY_SCRIPT = path.join(__dirname, 'proxy-server.js');
const TEST_SCRIPT = path.join(__dirname, 'run-bitget-futures-test.js');

console.log('Starting proxy-server.js and then running Bitget futures test.');
console.log('Proxy health URL:', PROXY_HEALTH);

const nodeExec = process.execPath; // Node executable path

// Spawn the proxy server as a child process
const proxy = spawn(nodeExec, [PROXY_SCRIPT], { cwd: __dirname, env: process.env });

proxy.stdout.on('data', (chunk) => {
  process.stdout.write(`[proxy stdout] ${chunk}`);
});
proxy.stderr.on('data', (chunk) => {
  process.stderr.write(`[proxy stderr] ${chunk}`);
});
proxy.on('exit', (code, signal) => {
  console.log(`Proxy process exited with code=${code} signal=${signal}`);
  process.exit(code || 0);
});

// Poll /health until up or timeout
function checkHealthOnce() {
  return new Promise((resolve) => {
    try {
      const u = new URL(PROXY_HEALTH);
      const opts = { hostname: u.hostname, port: u.port, path: u.pathname, method: 'GET', timeout: 3000 };
      const req = http.request(opts, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (c) => body += c);
        res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, body }));
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

async function waitForHealth(timeoutMs = 15000, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await checkHealthOnce();
    if (r.ok) return r;
    await new Promise(rp => setTimeout(rp, intervalMs));
  }
  return { ok: false, error: 'timeout waiting for health' };
}

(async () => {
  console.log('Waiting for proxy to be healthy...');
  const res = await waitForHealth();
  if (!res.ok) {
    console.error('Proxy did not become healthy in time:', res.error || res);
    console.error('Check proxy logs above. If proxy crashed, fix and re-run.');
    process.exitCode = 2;
    return;
  }

  console.log('Proxy is healthy. Running Bitget futures test script...');

  const tester = spawn(nodeExec, [TEST_SCRIPT], { cwd: __dirname, env: process.env, stdio: ['ignore','pipe','pipe'] });
  tester.stdout.on('data', (d) => process.stdout.write(`[tester] ${d}`));
  tester.stderr.on('data', (d) => process.stderr.write(`[tester-err] ${d}`));
  tester.on('exit', (code) => {
    console.log('Tester finished with code', code);
    console.log('Proxy will keep running until you terminate this process (Ctrl+C).');
  });
})();
