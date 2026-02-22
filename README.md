# Queued

A LAN-hosted Spotify party queue app. The host authenticates with Spotify, guests scan a QR code and add songs to the queue — no accounts, no friction.

## How it works

1. Host opens the app, clicks **New Session**, enters a session name and their name
2. Spotify OAuth flow runs — the host authorizes playback control
3. The app shows a QR code guests can scan to join
4. Guests search for songs and tap to add them to the queue
5. Songs queue up on the host's active Spotify device

## Stack

- **Monorepo**: Bun workspaces
- **Server**: Bun + Hono + tRPC
- **Web**: React 19 + Vite + TanStack Router + TanStack Query + TanStack Form
- **UI**: shadcn/ui (Radix + Tailwind CSS)
- **Shared**: Zod validators

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- A [Spotify Developer account](https://developer.spotify.com/dashboard) with an app registered

## Setup

### 1. Register a Spotify app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Under **Redirect URIs**, add: `http://localhost:4000/auth/callback`
4. Note your **Client ID** and **Client Secret**

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback
APP_URL=http://localhost:5173
PORT=4000
CORS_ORIGIN=http://localhost:5173
VITE_SERVER_URL=http://localhost:4000
```

### 3. Install and run

```bash
bun install
bun run dev
```

- Web app: http://localhost:5173
- API server: http://localhost:4000

## Usage

### As a host

1. Open http://localhost:5173
2. Click **New Session** and enter a session name and your name
3. Complete the Spotify authorization
4. On the session page, click the **⚙ settings** icon to select your Spotify Connect device
5. Share the QR code (or the URL) with guests

### As a guest

1. Scan the QR code or open the URL the host shared
2. Select the active session
3. Search for a song and tap **+** to add it to the queue

## Running on a LAN

To make the app accessible to other devices on your network, update `.env` with your machine's local IP:

```
APP_URL=http://192.168.1.x:5173
CORS_ORIGIN=http://192.168.1.x:5173
VITE_SERVER_URL=http://192.168.1.x:4000
SPOTIFY_REDIRECT_URI=http://192.168.1.x:4000/auth/callback
```

Also add the new redirect URI in your Spotify app settings. Then start with:

```bash
bun run dev:server &
bun run --cwd apps/web vite --host
```

## Development

```bash
bun run dev          # start web + server
bun run dev:web      # web only
bun run dev:server   # server only
bun run typecheck    # typecheck all packages
bun run format       # format with prettier
```

## Architecture notes

- **No database** — sessions live in an in-memory `Map` on the server. Restarting the server ends all sessions.
- **Token refresh** — Spotify access tokens are refreshed automatically before every API call if they're within 60 seconds of expiry.
- **Polling** — now playing updates every 3s, queue every 5s, session list every 10s.
