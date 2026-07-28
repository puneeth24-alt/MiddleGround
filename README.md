# MiddleGround

MiddleGround is a collaborative "where should we meet?" app. An owner creates a plan, shares a join link, participants pin their locations, the app calculates the geographic midpoint, and nearby venues are ranked around that midpoint.

This implementation follows the supplied architecture with Supabase persistence, Geoapify location services, and MapLibre rendering:

- Next.js App Router + TypeScript + Tailwind
- NextAuth with a local email credentials provider, plus optional GitHub/Google providers
- Supabase-backed persistence
- MapLibre map rendering
- Geoapify geocoding and Places proxy when `GEOAPIFY_API_KEY` is set
- Deterministic local place suggestions when Geoapify is not configured
- Owner dashboard, public join flow, participant cap, midpoint recalculation, radius filtering, owner moderation, and an SSE-compatible plan update stream

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The default local sign-in form accepts any valid email. Application data is stored in Supabase.

## Environment

Copy `.env.local.example` to `.env.local`.

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-32-random-characters"
GEOAPIFY_API_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
DATABASE_URL="postgresql://user:pass@localhost:5432/middleground"
```

Optional integrations:

- Set `GEOAPIFY_API_KEY` to geocode addresses and fetch real nearby cafes, restaurants, and pubs.
- Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Supabase persistence.
- Set GitHub or Google OAuth vars to show those sign-in buttons.
- See `DEPLOYMENT.md` for Vercel deployment steps.

## Product Flow

1. Sign in at `/login`.
2. Create a plan in `/dashboard`.
3. Open the plan workspace and copy its share link.
4. Participants join at `/join/[token]` and save a pin.
5. The app recalculates the midpoint and returns venue suggestions near it.

## Architecture Notes

The app is intentionally layered:

- `services/PlanService.ts` owns plan, participant, location, midpoint, and moderation rules through Supabase.
- `services/PlacesService.ts` owns Geoapify normalization, caching, and local fallback suggestions.
- `lib/supabase/client.ts` is the Supabase adapter used by server-side services.
- API routes are thin validation and orchestration layers.

Deployment instructions live in `DEPLOYMENT.md`.
