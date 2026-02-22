import { Music2 } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@queued/validators'

export function QueueList({ tracks }: { tracks: Track[] }) {
  if (tracks.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Queue is empty — add a song below!
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tracks.map((track, i) => {
        const albumArt = track.album.images[0]?.url
        const artists = track.artists.map((a) => a.name).join(', ')
        return (
          <div key={`${track.uri}-${i}`} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
            <span className="w-5 text-center text-xs text-muted-foreground">{i + 1}</span>
            {albumArt ? (
              <img src={albumArt} alt={track.album.name} className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                <Music2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{track.name}</p>
              <p className="truncate text-xs text-muted-foreground">{artists}</p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
          </div>
        )
      })}
    </div>
  )
}
