# Deploy MiddleGround on Vercel

This project is a Next.js app backed by Supabase, Geoapify, and MapLibre.

## 1. Prepare Supabase

1. Create or open the Supabase project.
2. Run the schema in `supabase-schema.sql` from the Supabase SQL editor.
3. Confirm these tables exist:
   - `users`
   - `plans`
   - `plan_participants`
   - `locations`
4. Copy the Project URL.
5. Copy a server-side key for the app backend. The current code reads it from `SUPABASE_SERVICE_ROLE_KEY`.

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not rename it to a `NEXT_PUBLIC_*` variable.

## 2. Prepare Geoapify

1. Create a Geoapify project.
2. Copy the API key.
3. Enable the key for Geocoding and Places usage.
4. In production, restrict the key where practical.

The code expects:

```bash
GEOAPIFY_API_KEY="..."
```

The app now also tolerates the old typo `GEOAPIF_API_KEY`, but use the corrected name in Vercel.

## 3. Configure Vercel

Import the GitHub repository into Vercel.

Use the default Next.js settings:

```bash
Framework Preset: Next.js
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Add these Environment Variables in Vercel Project Settings for Production and Preview:

```bash
NEXT_PUBLIC_APP_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_SECRET="a-long-random-secret"

NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-side-supabase-key"
DATABASE_URL="postgresql://..."

GEOAPIFY_API_KEY="your-geoapify-key"
```

Optional OAuth variables:

```bash
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
```

After adding or changing env vars, redeploy. Vercel applies env changes only to new deployments.

## 4. Configure Auth URLs

Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the final production URL.

If Google OAuth is enabled:

```text
https://your-domain.com/api/auth/callback/google
```

If GitHub OAuth is enabled:

```text
https://your-domain.com/api/auth/callback/github
```

For Preview deployments, either keep the local credentials login path enabled or add preview callback URLs in the OAuth provider dashboards.

## 5. Deploy

Push the branch connected to Vercel.

Vercel will install dependencies, run the Next.js build, and publish the deployment.

## 6. Smoke Test After Deploy

1. Open `/login`.
2. Sign in with the local credentials form or OAuth.
3. Create a plan in `/dashboard`.
4. Open the plan and copy the join link.
5. Open the join link in another browser session.
6. Search an address and save a pin.
7. Add another pin.
8. Confirm the midpoint appears on the MapLibre map.
9. Confirm `/api/places` returns cafes/restaurants/pubs around the midpoint.

## 7. Common Production Issues

### Geocoding says the key is not configured

Check that Vercel has `GEOAPIFY_API_KEY`, not `GEOAPIF_API_KEY`.

### Places returns empty or poor results

Confirm:

- The plan has at least one saved location.
- `midpoint_lat` and `midpoint_lng` are populated in Supabase.
- The requested radius is not too small.
- Geoapify key has Places API access.
- Categories are one or more of:
  - `catering.cafe`
  - `catering.restaurant`
  - `catering.pub`

### Supabase writes fail

Confirm `SUPABASE_SERVICE_ROLE_KEY` is a server-side key with permission to write. If you use a publishable key instead, RLS policies must explicitly permit the required inserts, updates, and deletes.

### Auth redirects to localhost

Update both:

```bash
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

Then redeploy.

## References

- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase with Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Geoapify Geocoding API: https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/
- Geoapify Places API: https://apidocs.geoapify.com/docs/places/
