const ports = [7779, 7780, 7781, 7782, 4779, 4780];

async function checkPort(port) {
  const base = `http://127.0.0.1:${port}`;
  const statusRes = await fetch(`${base}/api/status`);
  if (!statusRes.ok) return null;
  const status = await statusRes.json();
  const connRes = await fetch(`${base}/api/mcp/connection-info`);
  if (!connRes.ok) return null;
  const conn = await connRes.json();
  return { port, status, conn };
}

let found = null;
for (const port of ports) {
  try {
    // eslint-disable-next-line no-await-in-loop
    const result = await checkPort(port);
    if (result) {
      found = result;
      break;
    }
  } catch {
    // continue
  }
}

if (!found) {
  console.error('[verify] no running bridge found');
  process.exit(1);
}

console.log('[verify] bridge found at port', found.port);
console.log('[verify] endpoint:', found.conn.endpoint);
console.log('[verify] token exists:', Boolean(found.conn.token));
