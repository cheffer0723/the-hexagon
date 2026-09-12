# The Hexagon beta-production runbook

This repository is the standalone source of truth for The Hexagon. It ships a
static Hexagon web app and the `hexagon-api` review service.

## Product and service boundary

The Hexagon is not Obsidian Abyss. Do not deploy Hexagon code to, or route
Hexagon traffic through, the neighbouring legacy Railway service named
`webapp-backend`, even though both services currently appear in the Railway
project named `webapp-backend`.

- Hexagon repository: `cheffer0723/the-hexagon`
- Hexagon Railway service: `hexagon-api`
- Hexagon public API: `https://api.instance6.xyz`
- `ENGINE_DATA_URL`: read-only engine-data input for Hexagon. Confirm it points
  to the intended maintained data source before beta; do not print its value or
  any service secrets while checking it.

## Canonical surfaces

- Web: `https://syntheticsix.com`
- Web alias: `https://www.syntheticsix.com`
- API: `https://api.instance6.xyz`
- GitHub repo: `cheffer0723/the-hexagon`
- Static deployment: GitHub Pages workflow `.github/workflows/deploy.yml` from
  `main`; Cloudflare fronts the custom domains.

`syntheticsix.xyz` is not the current production hostname.

## No-charge verification

Run these before declaring the public surface healthy:

```bash
npm run typecheck
npm run build
npm --prefix api run build
npm run smoke
$env:HEXAGON_STRICT_BUNDLE_API='1'; npm run smoke
```

The smoke script verifies:

- API health
- API status/readiness
- six approved council seats
- canonical frontend CORS preflight
- invalid CSV rejection before any Anthropic request
- public apex and `www` web availability
- served JavaScript bundle is present
- strict mode verifies the served JavaScript bundle contains the configured API host

It intentionally does not run a real review, because a real review makes six
Anthropic Messages API calls.

## Paid/live review verification

Only run a real review after explicit approval from the project owner. It makes
six paid Anthropic Messages API calls.

Required CSV header:

```text
symbol,entry_date,exit_date,entry_price,exit_price,size
```

The API rejects malformed CSVs before calling Anthropic.

## Production gates

Before inviting beta testers, verify:

1. `https://syntheticsix.com` returns HTTP 200.
2. `https://www.syntheticsix.com` returns HTTP 200.
3. Public DNS still resolves through the intended Cloudflare-hosted surface.
4. The latest static deployment serves a bundle containing the configured API URL.
5. `https://api.instance6.xyz/healthz` returns `{ "ok": true }`.
6. `https://api.instance6.xyz/v1/status` returns `ready=true`.
7. `npm run smoke` passes from a clean checkout.
8. A deliberately invalid CSV returns 400 and does not call Anthropic.
9. The owner explicitly approves one paid real-review smoke if needed.

## Railway API variables

Required:

- `ANTHROPIC_API_KEY`
- `ENGINE_DATA_URL`
- `CORS_ORIGIN`

Optional:

- `ANTHROPIC_MODEL` (defaults to `claude-haiku-4-5-20251001`)
- `REVIEW_RATE_WINDOW_MS` (defaults to one hour)
- `REVIEW_RATE_MAX` (defaults to 3 started reviews per client per window)
- `REVIEW_GLOBAL_MAX` (defaults to 30 started reviews per service instance per window)
- `REVIEW_MAX_CONCURRENT` (defaults to 2 live reviews per service instance)

Do not print Railway variables or secret values in terminal output.

The application limits are a beta guardrail, not an authentication system or a
distributed quota. Keep the initial cohort small, add upstream bot protection
before making the invitation link public, and monitor Anthropic usage/errors.

## Scope boundary

The Hexagon is educational post-trade analysis. It is not investment advice, not an order router, and not a live trading system.
