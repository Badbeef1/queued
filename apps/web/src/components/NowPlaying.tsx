import { useState, useEffect } from 'react'
import { Music2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@queued/validators'

interface NowPlayingProps {
  isPlaying: boolean
  track: Track | null
  progressMs: number | null
}

export function NowPlaying({ isPlaying, track, progressMs }: NowPlayingProps) {
  const [localProgressMs, setLocalProgressMs] = useState(progressMs ?? 0)

  // Sync with server-pushed value
  useEffect(() => {
    setLocalProgressMs(progressMs ?? 0)
  }, [progressMs])

  // Animate locally when playing
  useEffect(() => {
    if (!isPlaying || !track) return
    const duration = track.duration_ms
    const id = setInterval(() => {
      setLocalProgressMs((p) => Math.min(p + 1000, duration))
    }, 1000)
    return () => clearInterval(id)
  }, [isPlaying, track?.uri])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!track) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
          <Music2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Nothing playing</p>
          <p className="text-sm text-muted-foreground">Start playing on Spotify</p>
        </div>
      </div>
    )
  }

  const albumArt = track.album.images[0]?.url
  const progressPct = (localProgressMs / track.duration_ms) * 100
  const artists = track.artists.map((a) => a.name).join(', ')

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-3">
        {albumArt ? (
          <img
            src={albumArt}
            alt={track.album.name}
            className="h-14 w-14 rounded object-cover shadow"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded bg-muted">
            <Music2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{track.name}</p>
          <p className="truncate text-sm text-muted-foreground">{artists}</p>
          <p className="text-xs text-muted-foreground">{isPlaying ? 'Playing' : 'Paused'}</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatDuration(localProgressMs)}</span>
          <span>{formatDuration(track.duration_ms)}</span>
        </div>
      </div>
    </div>
  )
}
