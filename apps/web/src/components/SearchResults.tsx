import { Plus, Music2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import type { Track } from '@queued/validators'

interface SearchResultsProps {
  tracks: Track[]
  isLoading: boolean
  onQueue: (track: Track) => void
  queuingUri?: string
}

export function SearchResults({ tracks, isLoading, onQueue, queuingUri }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Searching...
      </div>
    )
  }

  if (tracks.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {tracks.map((track) => {
        const albumArt = track.album.images[0]?.url
        const artists = track.artists.map((a) => a.name).join(', ')
        const isQueuing = queuingUri === track.uri

        return (
          <div
            key={track.uri}
            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
          >
            {albumArt ? (
              <img src={albumArt} alt={track.album.name} className="h-10 w-10 rounded object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                <Music2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{track.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {artists} · {track.album.name}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{formatDuration(track.duration_ms)}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              disabled={isQueuing}
              onClick={() => onQueue(track)}
            >
              {isQueuing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
