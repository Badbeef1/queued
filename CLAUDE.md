# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project

**Queued** — LAN-hosted Spotify party queue app. Guests scan a QR code and queue songs on the host's Spotify account without friction. No database — Spotify is the source of truth.

## Stack

- **Monorepo**: Bun workspaces
- **Server**: Bun + Hono + tRPC (`apps/server`)
- **Web**: React 19 + Vite + TanStack Router + TanStack Query + TanStack Form (`apps/web`)
- **Shared**: Zod validators (`packages/validators`)
- **UI**: shadcn/ui (Radix + Tailwind)

## Commands

```bash
# Start both web (port 5173) and server (port 4000)
bun run dev

# Start individually
bun run dev:web
bun run dev:server

# Typecheck all packages
bun run typecheck

# Format
bun run format
```

## Spotify OAuth Setup

1. Go to https://developer.spotify.com/dashboard
2. Create an app
3. Add redirect URI: `http://localhost:4000/auth/callback`
4. Copy `.env.example` to `.env` and fill in:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback`

## Architecture

### In-Memory Session Store

No database. Sessions live in a `Map` on the server process (`apps/server/src/lib/sessions.ts`).
Tokens are refreshed automatically before every Spotify API call (60-second buffer).

### OAuth Flow

1. User fills "Create Session" form → `GET /auth/spotify?name=...&hostName=...`
2. Server stores pending state → redirects to Spotify
3. Spotify → `GET /auth/callback?code=...&state=...`
4. Server exchanges code, creates session, redirects to `APP_URL/session/:id`

### tRPC

All app data flows through tRPC at `/trpc`. The `AppRouter` type is imported from
`@queued/server/trpc/index` in the web app using tsconfig path aliases.

### Polling Intervals

| Query | Interval |
|-------|----------|
| `spotify.nowPlaying` | 3s |
| `spotify.getQueue` | 5s |
| `session.list` | 10s |
| `spotify.getDevices` | 15s |

## Key File Locations

| What | Where |
|------|-------|
| Session store (in-memory Map) | `apps/server/src/lib/sessions.ts` |
| Spotify API wrapper | `apps/server/src/lib/spotify.ts` |
| tRPC routers | `apps/server/src/trpc/routers/` |
| tRPC AppRouter type | `apps/server/src/trpc/index.ts` |
| tRPC client setup | `apps/web/src/lib/trpc.ts` |
| Routes | `apps/web/src/routes/` |
| UI components | `apps/web/src/components/` |

## Environment Variables

```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback
APP_URL=http://localhost:5173
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_SERVER_URL=http://localhost:4000
```

# currentDate
Today's date is 2026-02-22.
