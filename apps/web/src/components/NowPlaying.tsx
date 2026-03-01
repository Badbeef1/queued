import { useState, useEffect, useRef } from 'react'
import { Music2, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat, Repeat1, Volume2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import type { Track } from '@queued/validators'

interface NowPlayingProps {
  isPlaying: boolean
  track: Track | null
  progressMs: number | null
  shuffleState: boolean
  repeatState: 'off' | 'track' | 'context'
  volumePercent: number | null
  sessionId: string
}

export function NowPlaying({
  isPlaying,
  track,
  progressMs,
  shuffleState,
  repeatState,
  volumePercent,
  sessionId,
}: NowPlayingProps) {
  const [localProgressMs, setLocalProgressMs] = useState(progressMs ?? 0)
  const [localVolume, setLocalVolume] = useState(volumePercent ?? 50)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Sync with server-pushed value
  useEffect(() => {
    setLocalProgressMs(progressMs ?? 0)
  }, [progressMs])

  useEffect(() => {
    if (volumePercent !== null) setLocalVolume(volumePercent)
  }, [volumePercent])

  // Animate locally when playing
  useEffect(() => {
    if (!isPlaying || !track) return
    const duration = track.duration_ms
    const id = setInterval(() => {
      setLocalProgressMs((p) => Math.min(p + 1000, duration))
    }, 1000)
    return () => clearInterval(id)
  }, [isPlaying, track?.uri, track?.duration_ms])

  const skipNextMutation = trpc.spotify.skipNext.useMutation()
  const skipPreviousMutation = trpc.spotify.skipPrevious.useMutation()
  const pauseMutation = trpc.spotify.pause.useMutation()
  const resumeMutation = trpc.spotify.resume.useMutation()
  const seekMutation = trpc.spotify.seek.useMutation()
  const setVolumeMutation = trpc.spotify.setVolume.useMutation()
  const setShuffleMutation = trpc.spotify.setShuffle.useMutation()
  const setRepeatMutation = trpc.spotify.setRepeat.useMutation()

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!track || !progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const positionMs = Math.round(pct * track.duration_ms)
    setLocalProgressMs(positionMs)
    seekMutation.mutate({ sessionId, positionMs })
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVolume(Number(e.target.value))
  }

  const handleVolumeCommit = (e: React.PointerEvent<HTMLInputElement>) => {
    const val = Number((e.target as HTMLInputElement).value)
    setVolumeMutation.mutate({ sessionId, volumePercent: val })
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMutation.mutate({ sessionId })
    } else {
      resumeMutation.mutate({ sessionId })
    }
  }

  const handleRepeat = () => {
    const next = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off'
    setRepeatMutation.mutate({ sessionId, state: next })
  }

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
    <div className="rounded-lg border p-4 space-y-3">
      {/* Track info */}
      <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Progress bar (clickable) */}
      <div className="space-y-1">
        <div
          ref={progressBarRef}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted cursor-pointer"
          onClick={handleSeek}
        >
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

      {/* Main controls */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skipPreviousMutation.mutate({ sessionId })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip previous"
        >
          <SkipBack className="h-5 w-5" />
        </button>
        <button
          onClick={handlePlayPause}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => skipNextMutation.mutate({ sessionId })}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Skip next"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Shuffle / Repeat */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShuffleMutation.mutate({ sessionId, state: !shuffleState })}
          className={cn(
            'transition-colors',
            shuffleState ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
          aria-label="Toggle shuffle"
        >
          <Shuffle className="h-4 w-4" />
        </button>
        <button
          onClick={handleRepeat}
          className={cn(
            'transition-colors',
            repeatState === 'off' ? 'text-muted-foreground hover:text-foreground' : 'text-primary',
          )}
          aria-label="Cycle repeat"
        >
          {repeatState === 'track' ? (
            <Repeat1 className="h-4 w-4" />
          ) : (
            <Repeat className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Volume */}
      {volumePercent !== null && (
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={localVolume}
            onChange={handleVolumeChange}
            onPointerUp={handleVolumeCommit}
            className="w-full accent-primary h-1.5 cursor-pointer"
            aria-label="Volume"
          />
        </div>
      )}
    </div>
  )
}
