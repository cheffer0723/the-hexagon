import assert from "node:assert/strict";

const apiBase = (process.env.HEXAGON_API_URL || "https://api.instance6.xyz").replace(/\/+$/, "");
const webUrl = process.env.HEXAGON_WEB_URL || "https://syntheticsix.com/";
const canonicalOrigin = "https://syntheticsix.com";
const allowedOrigins = [canonicalOrigin, "https://www.syntheticsix.com"];

assert.match(apiBase, /^https:\/\//, "Hexagon API must be served over HTTPS");

async function request(url, options) {
  const response = await fetch(url, options);
  const body = await response.text();
  return { response, body };
}

const health = await request(`${apiBase}/healthz`);
assert.equal(health.response.status, 200, `Hexagon health check failed: ${health.body}`);
assert.equal(JSON.parse(health.body).ok, true, "Hexagon health payload must be ok");

const status = await request(`${apiBase}/v1/status`);
assert.equal(status.response.status, 200, `Hexagon status check failed: ${status.body}`);
const statusBody = JSON.parse(status.body);
assert.equal(statusBody.ready, true, "Hexagon must be configured with OpenAI and engine data");
assert.equal(statusBody.seats, 6, "Hexagon must expose six council seats");
assert.deepEqual(
  statusBody.council?.map((seat) => seat.name),
  ["Aegis — Risk", "The Archon — Quant", "The Psyops Agent — Behavioral", "The Heretic — The Contrarian", "Cerberus — Regime Class", "The Sentinel — Defense"],
  "Hexagon must expose the approved council names",
);

for (const origin of allowedOrigins) {
  const corsPreflight = await request(`${apiBase}/v1/reviews`, {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });
  assert.equal(corsPreflight.response.status, 204, `CORS preflight failed for ${origin}: ${corsPreflight.body}`);
  assert.equal(
    corsPreflight.response.headers.get("access-control-allow-origin"),
    origin,
    `Hexagon API must allow frontend origin ${origin}`,
  );
}

const invalidReview = await request(`${apiBase}/v1/reviews`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: canonicalOrigin },
  body: JSON.stringify({ csv: "symbol,entry_date\nSPY,2026-01-01" }),
});
assert.equal(invalidReview.response.status, 400, "Invalid CSV must fail before an OpenAI request");

const page = await request(webUrl);
assert.equal(page.response.status, 200, `Hexagon web page failed: ${page.body.slice(0, 200)}`);
assert.match(page.body, /The Hexagon/i, "Hexagon web page must render the product copy");
const apiHost = new URL(apiBase).host;
const bundlePath = page.body.match(/assets\/index-[^"']+\.js/)?.[0];
assert.ok(bundlePath, "Hexagon web page must reference a built JavaScript bundle");
const bundleUrl = new URL(bundlePath, webUrl).toString();
const bundle = await request(bundleUrl);
assert.equal(bundle.response.status, 200, `Hexagon bundle failed: ${bundle.body.slice(0, 200)}`);
assert.match(bundle.body, new RegExp(apiHost.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Served bundle must contain ${apiHost}`);

const wwwPage = await request("https://www.syntheticsix.com/");
assert.equal(wwwPage.response.status, 200, `Hexagon www page failed: ${wwwPage.body.slice(0, 200)}`);
assert.match(wwwPage.body, /The Hexagon/i, "Hexagon www page must render the product copy");

console.log(
  JSON.stringify({
    ok: true,
    apiBase,
    webUrl,
    checks: ["health", "status", "cors-preflight", "invalid-csv", "web", "bundle-api", "www-web"],
  }),
);
