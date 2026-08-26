import assert from "node:assert/strict";

const apiBase = (process.env.HEXAGON_API_URL || "https://hexagon-api-production.up.railway.app").replace(/\/+$/, "");
const webUrl = process.env.HEXAGON_WEB_URL || "https://cheffer0723.github.io/the-hexagon/";

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

const invalidReview = await request(`${apiBase}/v1/reviews`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ csv: "symbol,entry_date\nSPY,2026-01-01" }),
});
assert.equal(invalidReview.response.status, 400, "Invalid CSV must fail before an OpenAI request");

const page = await request(webUrl);
assert.equal(page.response.status, 200, `Hexagon web page failed: ${page.body.slice(0, 200)}`);

console.log(JSON.stringify({ ok: true, apiBase, webUrl, checks: ["health", "status", "invalid-csv", "web"] }));
