# Setup

This is a pure Next.js application that deploys to **Vercel**. No separate
backend, no worker process, no Redis.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required for the app to even boot:

| Variable | What it is | How to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Vercel Postgres / Neon / Supabase / local Postgres |
| `AUTH_SECRET` | Random string used to sign session JWTs | `openssl rand -base64 32` |

Optional (only needed for "Continue with Google"):

| Variable | What it is | How to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client id | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Same place |

For Google OAuth, set the **Authorized redirect URI** to:

- Dev: `http://localhost:3000/api/auth/callback/google`
- Prod: `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`

## 3. Create the database schema

After `DATABASE_URL` is set:

```bash
npx prisma migrate dev --name init
```

This creates the `users`, `notifications`, and `reset_tokens` tables. Re-run
whenever the Prisma schema in `prisma/schema.prisma` changes.

## 4. Run locally

```bash
npm run dev
```

Then open <http://localhost:3000>.

## 5. Deploy to Vercel

```bash
# First time only
npx vercel link

# Push code, then add the same env vars in Vercel:
# Project → Settings → Environment Variables
#
# Vercel automatically runs `npm run build` (which calls `prisma generate`).
# Run migrations against the production DB once after the first deploy:
npx prisma migrate deploy
```

Vercel Cron jobs (deadline reminders, payment timeouts, notification retry)
will be added in a later task (`vercel.json` + the `/api/cron/*` route
handlers); they are not required for the auth / public-page flow to work.

## Testing

```bash
npm test       # 96 property + unit tests against in-memory fakes
npm run typecheck
npm run lint
```

Tests do **not** touch the database — they exercise the framework-agnostic
service layer against in-memory port fakes.
