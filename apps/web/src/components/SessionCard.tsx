import { Link } from '@tanstack/react-router'
import { Users, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Session } from '@queued/validators'

export function SessionCard({ session }: { session: Session }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{session.name}</p>
            <p className="text-sm text-muted-foreground">Hosted by {session.hostName}</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/session/$sessionId" params={{ sessionId: session.id }}>
            Join <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
