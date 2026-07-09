# The Hexagon

Standalone microsite for **The Hexagon** — an AI "war-room" trade-review council.
A trade is fed in and six specialist agents (Risk, Quant, Behavioral, Contrarian,
Regime, Devil's Advocate) deliberate on-screen and deliver a verdict: mistake or
defensible, with the gap between what you did and what the council would have done.

Extracted verbatim from the source-of-truth component in `webapp-frontend`.
Single component, no backend required to run the demo.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview
```

## Live vs sample

By default the app shows the built-in `SAMPLE` review. To run against a live
council backend, set an API base URL — the app POSTs demo CSV to
`${VITE_API_BASE_URL}/hexagon/review` and falls back to the sample if it's
unavailable:

```bash
VITE_API_BASE_URL=https://your-api.example.com npm run dev
```

## Deploy (GitHub Pages)

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`.
For a project page served under a subpath, the workflow sets `BASE_PATH`
accordingly. For a root/custom domain, leave `BASE_PATH` unset (defaults to `/`).

## Stack

Vite 7 · React 19 · TypeScript 5.9 · Tailwind 4. No router, no UI library —
the Hexagon renders its own layout with inline styles for color.

## Source of truth & syncing

The `Hexagon.tsx` and `sample.ts` files here are **mirrored** from `webapp-frontend`
(the flagship `/hexagon` route), which is canonical. Do not hand-edit them in this
repo — edit them in webapp-frontend, then pull the changes here:

```bash
./scripts/sync-hexagon.sh   # curls the latest from webapp-frontend/main
git diff                    # review, then commit
```

CI (`.github/workflows/check-drift.yml`) fails if these files drift from the
canonical copy, so the two can't silently diverge. If this microsite and the
product site ever share three or more pieces, graduate to a shared workspace
package (`packages/hexagon` imported by both) instead of file mirroring.
