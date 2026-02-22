import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Music2 } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold hover:opacity-80">
            <Music2 className="h-5 w-5 text-primary" />
            <span>Queued</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  )
}
