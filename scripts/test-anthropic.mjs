import assert from 'node:assert/strict';

// Exercise the real HTTP API with synthetic provider responses; no paid calls.
process.env.PORT = '13987';
process.env.ANTHROPIC_API_KEY = 'synthetic-test-key';
process.env.ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
process.env.ENGINE_DATA_URL = 'https://engine.test/data';
process.env.REVIEW_RATE_MAX = '5';
process.env.REVIEW_GLOBAL_MAX = '100';
process.env.REVIEW_MAX_CONCURRENT = '10';
const originalFetch = globalThis.fetch;
let mode = 'success';
let calls = 0;
globalThis.fetch = async (url, options) => {
  if (url === process.env.ENGINE_DATA_URL) return Response.json({ engines: [] });
  if (url === 'https://api.anthropic.com/v1/messages') {
    calls++;
    assert.equal(options.headers['x-api-key'], 'synthetic-test-key');
    assert.equal(options.headers['anthropic-version'], '2023-06-01');
    const body = JSON.parse(options.body);
    assert.equal(body.model, process.env.ANTHROPIC_MODEL);
    assert.equal(body.max_tokens, 600);
    assert.equal(body.messages[0].role, 'user');
    assert.ok(body.system.includes('VERDICT:'));
    assert.ok(!('store' in body));
    if (mode === 'auth') return Response.json({ error: { type: 'authentication_error' } }, { status: 401 });
    if (mode === 'quota') return Response.json({ error: { type: 'rate_limit_error' } }, { status: 429 });
    return Response.json({ stop_reason: mode === 'truncated' ? 'max_tokens' : 'end_turn', content: [{ type: 'text', text: mode === 'malformed' ? 'No verdict' : 'VERDICT: defensible\nThe record does not include a predefined stop. More context is needed.' }] });
  }
  return originalFetch(url, options);
};
const { server } = await import('../api/dist/index.cjs');
const base = 'http://127.0.0.1:13987';
const csv = 'symbol,entry_date,exit_date,entry_price,exit_price,size\nSPY,2026-08-03,2026-08-04,620,625,1';
const review = (value = csv) => originalFetch(`${base}/v1/reviews`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ csv: value }) });
try {
  const status = await (await originalFetch(`${base}/v1/status`)).json();
  assert.equal(status.provider, 'anthropic');
  assert.equal(status.ready, true);
  const success = await review();
  assert.equal(success.status, 200);
  const data = await success.json();
  assert.equal(data.review.agents.length, 6);
  assert.equal(calls, 6);
  assert.ok(data.review.agents.every(seat => seat.verdict === 'defensible'));
  assert.equal((await review('invalid')).status, 400);
  assert.equal(calls, 6, 'Invalid CSV must not call the provider');
  for (mode of ['auth', 'quota', 'malformed', 'truncated']) {
    const response = await review();
    assert.equal(response.status, 503, mode);
    const failure = await response.json();
    assert.equal(failure.ok, false);
    assert.ok(!JSON.stringify(failure).includes('synthetic-test-key'));
  }
  const callsBeforeRateLimit = calls;
  const rateLimited = await review();
  assert.equal(rateLimited.status, 429, 'sixth valid request must be limited before provider calls');
  assert.equal(calls, callsBeforeRateLimit, 'rate-limited request must not call the provider');
  console.log('PASS: six Anthropic seats, request format, CSV validation, provider errors, malformed/truncated output, beta rate limit');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server.close();
}
