# The Hexagon beta-production runbook

This repo ships the static Hexagon web app to GitHub Pages and the review API to Railway.

## Canonical surfaces

- Web: `https://syntheticsix.com`
- API: `https://api.instance6.xyz`
- GitHub repo: `cheffer0723/the-hexagon`
- GitHub Pages source: workflow deploy from `main`

`syntheticsix.xyz` is not the current production hostname.

## No-charge verification

Run these before declaring the public surface healthy:

```bash
npm run typecheck
npm run build
npm --prefix api run build
npm run smoke
```

The smoke script verifies:

- API health
- API status/readiness
- six approved council seats
- canonical frontend CORS preflight
- invalid CSV rejection before any OpenAI request
- public web availability

It intentionally does not run a real review, because a real review makes six OpenAI Responses API calls.

## Paid/live review verification

Only run a real review after explicit approval from the project owner.

Required CSV header:

```text
symbol,entry_date,exit_date,entry_price,exit_price,size
```

The API rejects malformed CSVs before calling OpenAI.

## Production gates

Before inviting beta testers, verify:

1. `https://syntheticsix.com` returns HTTP 200.
2. GitHub Pages reports `status=built`.
3. GitHub Pages HTTPS enforcement is enabled.
4. `https://api.instance6.xyz/healthz` returns `{ "ok": true }`.
5. `https://api.instance6.xyz/v1/status` returns `ready=true`.
6. `npm run smoke` passes from a clean checkout.
7. A deliberately invalid CSV returns 400 and does not call OpenAI.
8. The owner explicitly approves one paid real-review smoke if needed.

## Railway API variables

Required:

- `OPENAI_API_KEY`
- `ENGINE_DATA_URL`
- `CORS_ORIGIN`

Optional:

- `OPENAI_MODEL`

Do not print Railway variables or secret values in terminal output.

## Scope boundary

The Hexagon is educational post-trade analysis. It is not investment advice, not an order router, and not a live trading system.

