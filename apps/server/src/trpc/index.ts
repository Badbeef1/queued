import { router } from './trpc'
import { sessionRouter } from './routers/session'
import { spotifyRouter } from './routers/spotify'

export const appRouter = router({
  session: sessionRouter,
  spotify: spotifyRouter,
})

export type AppRouter = typeof appRouter
