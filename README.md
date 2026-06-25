# Dalinus Travels

International education consultancy and travel/tourism booking platform built with Next.js.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **i18n:** next-intl
- **Theme:** next-themes (light/dark/system)
- **Testing:** Vitest + fast-check (property-based)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth.js secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token |
| `RESEND_API_KEY` | Resend email API key |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `FLUTTERWAVE_VERIF_HASH` | Flutterwave webhook verification hash |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint & Format

```bash
npm run lint
npm run format:check
```

## Project Structure

```
src/
  app/          → Next.js App Router pages, layouts, and API routes
  domain/       → Domain entities, value objects, and validation
  services/     → Application services (framework-agnostic)
  ports/        → Repository and infrastructure interfaces
  infra/        → Infrastructure adapters (DB, email, storage, payments)
  ui/           → Reusable UI components (Navbar, Footer, ThemeToggle, etc.)
  i18n/         → Internationalization config and messages
```

## Deployment

This project is configured for Vercel:

```bash
vercel          # preview deployment
vercel --prod   # production deployment
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

## License

Private - All rights reserved.
