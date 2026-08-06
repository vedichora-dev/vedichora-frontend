# VedicHora — Frontend Web (vedichora-dev/vedichora-frontend)

## Project context
Next.js 14 TypeScript frontend deployed on Vercel (`vedichora-frontend-orcin.vercel.app`).
Western compatibility is the DEFAULT/hero flow. Vedic features are secondary.

## Stack
- Next.js 14, TypeScript strict, Tailwind CSS
- Playwright for E2E tests (config: `playwright.config.ts`, tests in `tests/` and `e2e/`)
- Vercel deployment (auto-deploys on push to main)

## API endpoints
- Auth: `https://vedichora-platform-production.up.railway.app`
- Chart: `https://enchanting-dedication-production.up.railway.app`
- Never hardcode `UtcOffsetHours` — backend auto-resolves DST-aware timezone from place name

## Key pages
- `/` — dashboard/home
- `/chart` — birth chart (Vedic)
- `/match` — Vedic compatibility (Ashta Koota, Pathu Porutham, Rajju/Vedha, dasha sync)
- `/western` — Western compatibility (DEFAULT hero flow)

## Current state
- Match result card shows birth details (nakshatra, rasi, rajju) on screen
- PDF cover shortened to 3-4 lines (Tamil format)
- Both `/match` and `/western` calling `/api/compat/score` and `/api/compat/dasha-sync`
- BirthTimeKnown gate enforced — blocks chart predictions when birth time unavailable

## Demo account
- Email: `demo@vedichora.com` / Password: `Demo1234!`

## Delivery rules
1. Read `e2e-results.txt` before making any changes in a new session
2. Never push directly to main
3. Run TypeScript check (`tsc --noEmit`) before every push
4. Playwright E2E tests run via `e2e.yml` workflow — check results before claiming done
5. Screenshots saved to `test-screenshots/` via git for visual verification
6. Never modify timezone — remove `UtcOffsetHours` field entirely, let backend resolve it
