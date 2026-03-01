import { useState, useEffect } from 'react'
import type { NowPlaying, Track, SessionState } from '@queued/validators'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000'

export function useSessionStream(sessionId: string): {
  nowPlaying: NowPlaying | null
  queue: Track[]
  connected: boolean
  addOptimisticTrack: (track: Track) => void
} {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource(`${SERVER_URL}/events/${sessionId}`, { withCredentials: true })

    es.addEventListener('state', (e) => {
      try {
        const state = JSON.parse(e.data) as SessionState
        setNowPlaying(state.nowPlaying)
        setQueue(state.queue)
      } catch {
        // ignore parse errors
      }
    })

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)

    return () => {
      es.close()
    }
  }, [sessionId])

  const addOptimisticTrack = (track: Track) => {
    setQueue((prev) => [...prev, track])
  }

  return { nowPlaying, queue, connected, addOptimisticTrack }
}
