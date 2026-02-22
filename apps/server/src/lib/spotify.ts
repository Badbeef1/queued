import { getSession, updateSession, type SpotifySession } from './sessions'

const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

async function refreshAccessToken(session: SpotifySession): Promise<SpotifySession> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${res.status}`)
  }

  const data = await res.json() as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }

  const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000)
  const updated = updateSession(session.id, {
    accessToken: data.access_token,
    tokenExpiresAt,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  })

  return updated!
}

async function getValidToken(sessionId: string): Promise<string> {
  let session = getSession(sessionId)
  if (!session) throw new Error('Session not found')

  // Refresh if expiring within 60 seconds
  if (session.tokenExpiresAt.getTime() - Date.now() < 60_000) {
    session = await refreshAccessToken(session)
  }

  return session.accessToken
}

async function spotifyFetch(
  sessionId: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getValidToken(sessionId)
  return fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

export async function searchTracks(sessionId: string, query: string) {
  const res = await spotifyFetch(
    sessionId,
    `/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
  )
  if (!res.ok) throw new Error(`Spotify search failed: ${res.status}`)
  const data = await res.json() as { tracks: { items: unknown[] } }
  return data.tracks.items
}

export async function queueTrack(sessionId: string, trackUri: string, deviceId?: string) {
  const params = new URLSearchParams({ uri: trackUri })
  if (deviceId) params.append('device_id', deviceId)

  const res = await spotifyFetch(sessionId, `/me/player/queue?${params}`, {
    method: 'POST',
  })

  if (!res.ok && res.status !== 204) {
    const body = await res.text()
    throw new Error(`Failed to queue track: ${res.status} ${body}`)
  }
}

export async function getNowPlaying(sessionId: string) {
  const res = await spotifyFetch(sessionId, '/me/player/currently-playing')
  if (res.status === 204 || res.status === 404) {
    return { isPlaying: false, track: null, progressMs: null }
  }
  if (!res.ok) throw new Error(`Failed to get now playing: ${res.status}`)
  const data = await res.json() as {
    is_playing: boolean
    item: unknown
    progress_ms: number
  }
  return {
    isPlaying: data.is_playing,
    track: data.item,
    progressMs: data.progress_ms,
  }
}

export async function getQueue(sessionId: string) {
  const res = await spotifyFetch(sessionId, '/me/player/queue')
  if (!res.ok) throw new Error(`Failed to get queue: ${res.status}`)
  const data = await res.json() as { currently_playing: unknown; queue: unknown[] }
  return data
}

export async function getDevices(sessionId: string) {
  const res = await spotifyFetch(sessionId, '/me/player/devices')
  if (!res.ok) throw new Error(`Failed to get devices: ${res.status}`)
  const data = await res.json() as { devices: unknown[] }
  return data.devices
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${body}`)
  }

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
  }
}
