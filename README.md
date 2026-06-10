# PRISM

A system to help businesses adopt the right software solutions.

## Prerequisites

- **Node.js** 18+ (Node 22 recommended; used by dev tooling)
- **npm** (comes with Node)
- **PostgreSQL** 14+ running locally or reachable over the network
- **Expo Go** (optional) — for testing the mobile app on a physical phone without a native build

Bun is listed as a dependency but is **not required** for local development. All documented scripts use Node.

## Project layout

| Path | Purpose |
|------|---------|
| Repo root | Web app + API (TanStack Start / Vite) |
| `PRISM_APP/` | Mobile app (Expo / React Native) |
| `migrations/` | SQL migrations |
| `scripts/` | Database migrate & seed scripts |

## Environment setup

From the repo root:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/prism`) |
| `APP_URL` | Public URL of the web app (default: `http://localhost:5000`) — used in verification emails and OAuth redirects |
| `JWT_SECRET` | Secret for signing auth tokens — change from the example value |
| `APP_NAME` | Display name in emails (default: `PRISM`) |

Optional variables (see `.env.example` for full list):

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `SMTP_*` / `EMAIL_FROM` — outbound email in production (set `SMTP_USER` and `SMTP_PASS`). In local dev without SMTP, verification and password-reset links are printed in the terminal and shown on the signup/forgot pages — no email server needed. Set `SMTP_FORCE=true` to use Ethereal test SMTP instead.
- `SCRAPER_API_KEY` — protects `POST /api/scraper`

Create the database if it does not exist (adjust user/host as needed):

```bash
createdb prism
```

## Database

Run migrations from the **repo root** (requires `.env` with `DATABASE_URL`):

```bash
npm install
npm run migrate
```

Optionally load demo users and sample data:

```bash
npm run seed
```

Demo accounts created by seed (passwords shown in `scripts/seed.ts`):

- `admin@prism.local` — admin
- `mod@prism.local` — moderator
- `vendor@acme.local` — vendor
- `user@demo.local` — user

## Web frontend + API (single dev server)

PRISM uses **TanStack Start** on Vite. One command serves both the React web UI and the `/api/*` routes.

From the **repo root**:

```bash
npm install
npm run dev
```

| | |
|---|---|
| **URL** | [http://localhost:5000](http://localhost:5000) |
| **Port** | `5000` (fixed; see `vite.config.ts`) |
| **API** | Same origin, e.g. `http://localhost:5000/api/health` |

There is no separate backend process for local development. API route handlers live under `src/routes/api/`.

### Other root scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Mobile app (`PRISM_APP`)

The Expo app talks to the same API as the web client.

### 1. Start the API server

In the repo root (see above):

```bash
npm run dev
```

### 2. Configure API URL

The app reads `EXPO_PUBLIC_API_URL`. Defaults to `http://localhost:5000` when unset.

**Emulator / simulator** — default is usually fine.

**Physical device** — `localhost` points at the phone, not your PC. Create `PRISM_APP/.env`:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:5000
```

Replace `YOUR_LAN_IP` with your machine's local IP (e.g. `192.168.1.42`). The dev server binds to `0.0.0.0`, so it accepts LAN connections.

### 3. Start Expo

```bash
cd PRISM_APP
npm install
npm start
```

(`npm start` runs `expo start`.)

Then open the app in Expo Go, an emulator, or a dev build:

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server (QR code / menu) |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run in the browser via Expo |

## How web and API relate

```
┌─────────────────────────────────────────┐
│  npm run dev  (port 5000)               │
│  TanStack Start + Vite                  │
│  ┌─────────────┐  ┌─────────────────┐ │
│  │ Web UI      │  │ /api/* routes   │ │
│  │ (React)     │  │ (server handlers)│ │
│  └─────────────┘  └────────┬────────┘ │
└──────────────────────────────┼──────────┘
                               │
                               ▼
                        PostgreSQL
                               ▲
                               │
                    ┌──────────┴──────────┐
                    │  PRISM_APP (Expo)   │
                    │  EXPO_PUBLIC_API_URL│
                    └─────────────────────┘
```

- **Web**: browser loads pages from the same server; API calls go to `/api/...` on port 5000.
- **Mobile**: HTTP client calls the URL in `EXPO_PUBLIC_API_URL` (typically the same host/port as `npm run dev`).

## Troubleshooting

### `DATABASE_URL is required` when running migrate or seed

Create `.env` from `.env.example` in the **repo root** and set `DATABASE_URL`. Migrate and seed load `.env` explicitly; they do not use shell exports alone.

### Database connection errors

- Confirm PostgreSQL is running.
- Ensure the database in `DATABASE_URL` exists (`createdb prism`).
- Run `npm run migrate` before `npm run seed`.

### Port 5000 already in use

Vite is configured with `strictPort: true`. Stop the other process or change the port in `vite.config.ts` and update `APP_URL` / `EXPO_PUBLIC_API_URL` to match.

### Mobile app cannot reach the API

- Backend must be running: `npm run dev` from repo root.
- On a physical device, set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, not `localhost`.
- Allow port 5000 through your firewall if needed.

### Bun not installed / not on PATH

Ignore it. Use `npm run migrate`, `npm run seed`, and `npm run dev` — all run on Node.

### Google login shows "not configured"

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`, or use email/password auth with seeded demo users.

### Email verification in dev

Without `SMTP_USER` and `SMTP_PASS`, PRISM does **not** connect to any mail server. After signup or forgot-password, open the verification/reset link from:

1. The **dev server terminal** (look for the boxed `📧 PRISM` log with the link), or
2. The **amber dev banner** on the signup or forgot-password success screen.

To test real SMTP delivery locally, set `SMTP_USER`, `SMTP_PASS`, and related `SMTP_*` vars. To use Ethereal test mail without your own SMTP creds, set `SMTP_FORCE=true` (requires outbound port 587).
