import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

// The server redirects directly to /session/:id after OAuth.
// This page handles edge cases where the redirect didn't work.
function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate({ to: '/' }), 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  )
}
