import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { NowPlaying } from '@/components/NowPlaying'
import { QueueList } from '@/components/QueueList'
import { SearchBar } from '@/components/SearchBar'
import { SearchResults } from '@/components/SearchResults'
import { useSessionStream } from '@/lib/useSessionStream'
import type { Track } from '@queued/validators'

export const Route = createFileRoute('/session/$sessionId/')({
  component: SessionPage,
})

function SessionPage() {
  const { sessionId } = Route.useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [queuingUri, setQueuingUri] = useState<string | undefined>()

  const sessionQuery = trpc.session.get.useQuery({ id: sessionId })

  const { nowPlaying, queue, addOptimisticTrack } = useSessionStream(sessionId)

  const searchQuery_ = trpc.spotify.search.useQuery(
    { sessionId, query: searchQuery },
    {
      enabled: searchQuery.length > 2,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 30_000,
    },
  )

  const queueMutation = trpc.spotify.queue.useMutation({
    onSuccess: (_data, variables) => {
      setQueuingUri(undefined)
      const track = (searchQuery_.data as Track[] | undefined)?.find(
        (t) => t.uri === variables.trackUri,
      )
      toast({
        title: 'Added to queue',
        description: track ? `${track.name} by ${track.artists[0]?.name}` : undefined,
      })
    },
    onError: (err) => {
      setQueuingUri(undefined)
      toast({ title: 'Failed to queue', description: err.message, variant: 'destructive' })
    },
  })

  const handleQueue = useCallback(
    (track: Track) => {
      setQueuingUri(track.uri)
      addOptimisticTrack(track)
      queueMutation.mutate({ sessionId, trackUri: track.uri })
    },
    [sessionId, queueMutation, addOptimisticTrack],
  )

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
  }, [])

  if (sessionQuery.isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading session...</div>
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Session not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  const session = sessionQuery.data
  const searchResults = (searchQuery_.data ?? []) as Track[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{session.name}</h1>
          <p className="text-sm text-muted-foreground">Hosted by {session.hostName}</p>
        </div>
        <Button asChild variant="ghost" size="icon">
          <Link to="/session/$sessionId/setup" params={{ sessionId }}>
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Now Playing */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Now Playing</h2>
        <NowPlaying
          isPlaying={nowPlaying?.isPlaying ?? false}
          track={(nowPlaying?.track as Track) ?? null}
          progressMs={nowPlaying?.progressMs ?? null}
        />
      </section>

      <Separator />

      {/* Search */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Add to Queue</h2>
        <SearchBar onSearch={handleSearch} placeholder="Search for a song..." isLoading={searchQuery_.isLoading} />
        {searchQuery.length > 2 && (
          <SearchResults
            tracks={searchResults}
            isLoading={searchQuery_.isLoading}
            onQueue={handleQueue}
            queuingUri={queuingUri}
          />
        )}
      </section>

      <Separator />

      {/* Up Next */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Up Next</h2>
        <QueueList tracks={queue} />
      </section>
    </div>
  )
}
