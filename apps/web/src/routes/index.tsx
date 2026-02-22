import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Music2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { SessionCard } from '@/components/SessionCard'
import { CreateSessionForm } from '@/components/CreateSessionForm'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [open, setOpen] = useState(false)
  const { data: sessions = [], isLoading } = trpc.session.list.useQuery(undefined, {
    refetchInterval: 10_000,
  })

  const appUrl = window.location.origin

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Music2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Queued</h1>
        <p className="mt-2 text-muted-foreground">
          Scan the QR code to join a session and queue songs on Spotify.
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <QRCodeDisplay url={appUrl} />
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Session</DialogTitle>
              </DialogHeader>
              <CreateSessionForm onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <Music2 className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No active sessions.</p>
            <p className="text-sm">Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
