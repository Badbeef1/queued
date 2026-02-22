import { nanoid } from 'nanoid'

export interface SpotifySession {
  id: string
  name: string
  hostName: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  deviceId?: string
  createdAt: Date
}

const sessions = new Map<string, SpotifySession>()

export function createSession(
  data: Omit<SpotifySession, 'id' | 'createdAt'>,
): SpotifySession {
  const session: SpotifySession = {
    id: nanoid(10),
    createdAt: new Date(),
    ...data,
  }
  sessions.set(session.id, session)
  return session
}

export function getSession(id: string): SpotifySession | undefined {
  return sessions.get(id)
}

export function updateSession(id: string, updates: Partial<SpotifySession>): SpotifySession | undefined {
  const session = sessions.get(id)
  if (!session) return undefined
  const updated = { ...session, ...updates }
  sessions.set(id, updated)
  return updated
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id)
}

export function listSessions(): SpotifySession[] {
  return Array.from(sessions.values())
}

export function toPublicSession(session: SpotifySession) {
  return {
    id: session.id,
    name: session.name,
    hostName: session.hostName,
    deviceId: session.deviceId,
    createdAt: session.createdAt.toISOString(),
  }
}
