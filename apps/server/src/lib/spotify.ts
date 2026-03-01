import { getSession, updateSession, type SpotifySession } from './sessions'

declare const process: { env: Record<string, string | undefined> }

const SPOTIFY_API = 'https://api.spotify.com/v1'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'

async function refreshAccessToken(session: SpotifySession): Promise<SpotifySession> {
  const clientId = process.env['SPOTIFY_CLIENT_ID']!
  const clientSecret = process.env['SPOTIFY_CLIENT_SECRET']!
  const credentials = btoa(`${clientId}:${clientSecret}`)

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
  const params = new URLSearchParams({ q: query, type: 'track', limit: '10' })
  const res = await spotifyFetch(sessionId, `/search?${params}`)
  if (!res.ok) {
    const body = await res.text()
    console.error(`Spotify search failed: ${res.status}`, body)
    throw new Error(`Spotify search failed: ${res.status} — ${body}`)
  }
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
  const res = await spotifyFetch(sessionId, '/me/player')
  if (res.status === 204 || res.status === 404) {
    return { isPlaying: false, track: null, progressMs: null, shuffleState: false, repeatState: 'off' as const, volumePercent: null }
  }
  if (!res.ok) throw new Error(`Failed to get now playing: ${res.status}`)
  const data = await res.json() as {
    is_playing: boolean
    item: unknown
    progress_ms: number
    shuffle_state: boolean
    repeat_state: 'off' | 'track' | 'context'
    device: { volume_percent: number | null }
  }
  return {
    isPlaying: data.is_playing,
    track: data.item,
    progressMs: data.progress_ms,
    shuffleState: data.shuffle_state,
    repeatState: data.repeat_state,
    volumePercent: data.device?.volume_percent ?? null,
  }
}

export async function skipNext(sessionId: string): Promise<void> {
  const res = await spotifyFetch(sessionId, '/me/player/next', { method: 'POST' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to skip next: ${res.status}`)
}

export async function skipPrevious(sessionId: string): Promise<void> {
  const res = await spotifyFetch(sessionId, '/me/player/previous', { method: 'POST' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to skip previous: ${res.status}`)
}

export async function pausePlayback(sessionId: string): Promise<void> {
  const res = await spotifyFetch(sessionId, '/me/player/pause', { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to pause: ${res.status}`)
}

export async function resumePlayback(sessionId: string): Promise<void> {
  const res = await spotifyFetch(sessionId, '/me/player/play', { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to resume: ${res.status}`)
}

export async function setVolume(sessionId: string, volumePercent: number): Promise<void> {
  const params = new URLSearchParams({ volume_percent: String(Math.round(volumePercent)) })
  const res = await spotifyFetch(sessionId, `/me/player/volume?${params}`, { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to set volume: ${res.status}`)
}

export async function setShuffle(sessionId: string, state: boolean): Promise<void> {
  const params = new URLSearchParams({ state: String(state) })
  const res = await spotifyFetch(sessionId, `/me/player/shuffle?${params}`, { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to set shuffle: ${res.status}`)
}

export async function setRepeat(sessionId: string, state: 'off' | 'track' | 'context'): Promise<void> {
  const params = new URLSearchParams({ state })
  const res = await spotifyFetch(sessionId, `/me/player/repeat?${params}`, { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to set repeat: ${res.status}`)
}

export async function seekToPosition(sessionId: string, positionMs: number): Promise<void> {
  const params = new URLSearchParams({ position_ms: String(Math.round(positionMs)) })
  const res = await spotifyFetch(sessionId, `/me/player/seek?${params}`, { method: 'PUT' })
  if (!res.ok && res.status !== 204) throw new Error(`Failed to seek: ${res.status}`)
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
  const clientId = process.env['SPOTIFY_CLIENT_ID']!
  const clientSecret = process.env['SPOTIFY_CLIENT_SECRET']!
  const redirectUri = process.env['SPOTIFY_REDIRECT_URI']!
  const credentials = btoa(`${clientId}:${clientSecret}`)

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
