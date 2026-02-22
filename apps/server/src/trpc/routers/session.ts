import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { deleteSession, getSession, listSessions, toPublicSession } from '../../lib/sessions'
import { TRPCError } from '@trpc/server'

export const sessionRouter = router({
  list: publicProcedure.query(() => {
    return listSessions().map(toPublicSession)
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const session = getSession(input.id)
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })
      return toPublicSession(session)
    }),

  end: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const deleted = deleteSession(input.id)
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })
      return { success: true }
    }),
})
