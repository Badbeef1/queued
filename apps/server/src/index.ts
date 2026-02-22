import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { trpcServer } from '@hono/trpc-server'
import { appRouter } from './trpc'
import { createContext } from './trpc/context'
import { createSession, getSession } from './lib/sessions'
import { exchangeCodeForTokens } from './lib/spotify'

// Pending OAuth sessions: state -> { name, hostName }
const pendingOAuth = new Map<string, { name: string; hostName: string }>()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
)

// tRPC
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext,
  }),
)

// Health check
app.get('/health', (c) => c.json({ ok: true }))

// Start Spotify OAuth
app.get('/auth/spotify', (c) => {
  const name = c.req.query('name')
  const hostName = c.req.query('hostName')

  if (!name || !hostName) {
    return c.json({ error: 'name and hostName are required' }, 400)
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) return c.json({ error: 'SPOTIFY_CLIENT_ID not configured' }, 500)

  // Use a random state to prevent CSRF and carry session data
  const state = crypto.randomUUID()
  pendingOAuth.set(state, { name, hostName })

  // Clean up stale pending states after 10 minutes
  setTimeout(() => pendingOAuth.delete(state), 10 * 60 * 1000)

  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' ')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI ?? 'http://localhost:4000/auth/callback',
    state,
  })

  return c.redirect(`https://accounts.spotify.com/authorize?${params}`)
})

// Spotify OAuth callback
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'

  if (error) {
    return c.redirect(`${appUrl}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return c.redirect(`${appUrl}?error=missing_params`)
  }

  const pending = pendingOAuth.get(state)
  if (!pending) {
    return c.redirect(`${appUrl}?error=invalid_state`)
  }

  pendingOAuth.delete(state)

  try {
    const tokens = await exchangeCodeForTokens(code)
    const session = createSession({
      name: pending.name,
      hostName: pending.hostName,
      ...tokens,
    })

    return c.redirect(`${appUrl}/session/${session.id}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return c.redirect(`${appUrl}?error=token_exchange_failed`)
  }
})

const port = parseInt(process.env.PORT ?? '4000')
console.log(`Server running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
