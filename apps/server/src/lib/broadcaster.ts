import { getNowPlaying, getQueue } from './spotify'
import { getSession } from './sessions'
import { NowPlayingSchema, TrackSchema, type SessionState } from '@queued/validators'
import { z } from 'zod'

declare const process: { env: Record<string, string | undefined> }

const encoder = new TextEncoder()

interface SessionBroadcaster {
  clients: Set<ReadableStreamDefaultController<Uint8Array>>
  lastState: SessionState | null
  lastTrackUri: string | null
  timer: ReturnType<typeof setTimeout> | null
}

const broadcasters = new Map<string, SessionBroadcaster>()

function formatSSE(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

function computeNextPollMs(state: SessionState | null): number {
  if (
    !state?.nowPlaying.isPlaying ||
    !state.nowPlaying.track ||
    state.nowPlaying.progressMs === null
  ) {
    return 30_000
  }
  const remaining = state.nowPlaying.track.duration_ms - state.nowPlaying.progressMs
  if (remaining <= 0) return 1_000
  return Math.max(1_000, Math.min(remaining - 2_000, 30_000))
}

function sendState(broadcaster: SessionBroadcaster, state: SessionState) {
  const payload = formatSSE('state', state)
  const dead: ReadableStreamDefaultController<Uint8Array>[] = []
  for (const controller of broadcaster.clients) {
    try {
      controller.enqueue(payload)
    } catch {
      dead.push(controller)
    }
  }
  for (const c of dead) broadcaster.clients.delete(c)
}

function stopBroadcaster(sessionId: string) {
  const broadcaster = broadcasters.get(sessionId)
  if (!broadcaster) return
  if (broadcaster.timer) clearTimeout(broadcaster.timer)
  broadcasters.delete(sessionId)
}

async function pollAndBroadcast(sessionId: string): Promise<void> {
  const broadcaster = broadcasters.get(sessionId)
  if (!broadcaster) return

  if (broadcaster.clients.size === 0) {
    stopBroadcaster(sessionId)
    return
  }

  if (!getSession(sessionId)) {
    stopBroadcaster(sessionId)
    return
  }

  try {
    const rawNowPlaying = await getNowPlaying(sessionId)
    const nowPlaying = NowPlayingSchema.parse(rawNowPlaying)

    const currentTrackUri = nowPlaying.track?.uri ?? null
    const trackChanged = currentTrackUri !== broadcaster.lastTrackUri

    let queue = broadcaster.lastState?.queue ?? []
    if (trackChanged || !broadcaster.lastState) {
      try {
        const rawQueue = await getQueue(sessionId)
        queue = z.array(TrackSchema).parse(rawQueue.queue)
      } catch {
        // keep last known queue on error
      }
    }

    const state: SessionState = { nowPlaying, queue }
    broadcaster.lastState = state
    broadcaster.lastTrackUri = currentTrackUri

    sendState(broadcaster, state)
  } catch (err) {
    console.error(`[broadcaster] Poll error for session ${sessionId}:`, err)
  }

  // Schedule next poll (re-read broadcaster in case sendState removed dead clients)
  const b = broadcasters.get(sessionId)
  if (b) {
    if (b.clients.size === 0) {
      stopBroadcaster(sessionId)
    } else {
      const delay = computeNextPollMs(b.lastState)
      b.timer = setTimeout(() => void pollAndBroadcast(sessionId), delay)
    }
  }
}

export function registerClient(
  sessionId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): () => void {
  let broadcaster = broadcasters.get(sessionId)
  const isFirst = !broadcaster || broadcaster.clients.size === 0

  if (!broadcaster) {
    broadcaster = { clients: new Set(), lastState: null, lastTrackUri: null, timer: null }
    broadcasters.set(sessionId, broadcaster)
  }

  broadcaster.clients.add(controller)

  // Send cached state immediately so new clients don't wait for next poll
  if (broadcaster.lastState) {
    try {
      controller.enqueue(formatSSE('state', broadcaster.lastState))
    } catch {
      // client already gone
    }
  }

  if (isFirst) {
    if (broadcaster.timer) clearTimeout(broadcaster.timer)
    void pollAndBroadcast(sessionId)
  }

  return () => {
    const b = broadcasters.get(sessionId)
    if (!b) return
    b.clients.delete(controller)
    if (b.clients.size === 0) stopBroadcaster(sessionId)
  }
}

export async function broadcastRefresh(sessionId: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 800))
  const broadcaster = broadcasters.get(sessionId)
  if (!broadcaster || broadcaster.clients.size === 0) return
  if (broadcaster.timer) {
    clearTimeout(broadcaster.timer)
    broadcaster.timer = null
  }
  await pollAndBroadcast(sessionId)
}
