import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DeviceSelector } from '@/components/DeviceSelector'
import { toast } from '@/components/ui/use-toast'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/session/$sessionId/setup')({
  component: SetupPage,
})

function SetupPage() {
  const { sessionId } = Route.useParams()
  const navigate = useNavigate()

  const sessionQuery = trpc.session.get.useQuery({ id: sessionId })

  const endSession = trpc.session.end.useMutation({
    onSuccess: () => {
      toast({ title: 'Session ended' })
      navigate({ to: '/' })
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  if (sessionQuery.isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>
  }

  if (!sessionQuery.data) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Session not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Home</Link>
        </Button>
      </div>
    )
  }

  const session = sessionQuery.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/session/$sessionId" params={{ sessionId }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-semibold">Session Setup</h1>
          <p className="text-sm text-muted-foreground">{session.name}</p>
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium">Playback Device</h2>
        <p className="text-sm text-muted-foreground">
          Select which Spotify device songs should queue on.
        </p>
        <DeviceSelector sessionId={sessionId} />
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Ending the session removes it for all guests.
        </p>
        <Button
          variant="destructive"
          onClick={() => endSession.mutate({ id: sessionId })}
          disabled={endSession.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {endSession.isPending ? 'Ending...' : 'End Session'}
        </Button>
      </section>
    </div>
  )
}
