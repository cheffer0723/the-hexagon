# The Hexagon

Standalone product for **The Hexagon** — an AI "war-room" trade-review council.
The visitor uploads a completed-trades CSV; six independent OpenAI reviewer roles
(Risk, Quant, Behavioral, Contrarian, Regime, Devil's Advocate) deliberate
on-screen and return a forensic verdict. The product is separate from Obsidian
Abyss; it consumes configured engine data without exposing a Hexagon route there.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
```

## Live council

The static site does not fall back to a fake live review. Configure the deployed
Hexagon API URL at build time:

```bash
VITE_HEXAGON_API_BASE_URL=https://your-api.example.com npm run dev
```

## Deploy

The customer-facing hostname is `https://syntheticsix.com`. Current public DNS
is served through Cloudflare, with `www.syntheticsix.com` pointing at
`the-hexagon.pages.dev`.

Pushing to `main` also builds the static artifact via
`.github/workflows/deploy.yml`. For a project page served under a subpath, the
workflow sets `BASE_PATH` accordingly. For a root/custom domain, leave
`BASE_PATH` unset (defaults to `/`).

See [docs/beta-production-runbook.md](docs/beta-production-runbook.md) for the
no-charge production checks and the paid-review approval boundary.

## Stack

Vite 7 · React 19 · TypeScript 5.9 · Tailwind 4. No router, no UI library —
the Hexagon renders its own layout with inline styles for color.

## API service

`api/` is the Railway service root for `hexagon-api`. It exposes `GET /healthz`,
`GET /v1/status`, and `POST /v1/reviews`. It accepts the documented CSV format,
does not persist uploads, loads engine data from `ENGINE_DATA_URL`, and makes six
parallel OpenAI Responses API calls using one `OPENAI_API_KEY`.

Required Railway variables:

```text
OPENAI_API_KEY=...                 # fresh project key; do not commit it
ENGINE_DATA_URL=https://.../api/backtests/engines
CORS_ORIGIN=https://your-frontend-domain
OPENAI_MODEL=gpt-5-nano            # optional override; cheapest GPT-5 default
```

Set Railway's service root directory to `/api`. This repository is now the
canonical source for the Hexagon experience.

For the GitHub Pages workflow, add the non-secret repository variable
`HEXAGON_API_BASE_URL` with the public URL of that Railway service before
deploying the frontend.
