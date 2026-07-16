# VedicHora — React Frontend

## Stack
- **Next.js 14** — React framework with App Router
- **Tailwind CSS** — utility-first styling
- **shadcn/ui compatible** — Radix UI primitives
- **Zustand** — global state (auth token, currency, language)
- **Axios** — API calls with auto token refresh

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Demo login
- Email: admin@vedichora.com
- Password: Admin@123

## APIs
- Auth: https://vedichora-platform-production.up.railway.app
- Chart: https://enchanting-dedication-production.up.railway.app

## Deploy to Vercel
```bash
npx vercel --prod
```

## Pages built
- `/` — Home with zodiac strip and daily horoscope
- `/chart` — Kundali birth chart calculator (wired to live API)
- `/match` — Compatibility matching with Ashta Koota + Pathu Porutham
- `/consult` — Astrologer marketplace
- `/numerology` — Vedic numerology calculator
- `/signin` — Login (pre-filled with demo credentials)
- `/signup` — Registration

## Pages to add next
- `/transits` — Planet transits and Sade Sati
- `/yogas` — Yoga combinations
- `/remedies` — Gemstones and mantras
- `/muhurta` — Auspicious timing
- `/varshaphal` — Annual chart
- `/shop` — Credit packs
- `/learn` — Article library
- `/dashboard` — User dashboard
