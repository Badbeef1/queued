import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { publicProcedure, router } from '../trpc'
import { getSession, updateSession } from '../../lib/sessions'
import {
  searchTracks,
  queueTrack,
  getNowPlaying,
  getQueue,
  getDevices,
  skipNext,
  skipPrevious,
  pausePlayback,
  resumePlayback,
  setVolume,
  setShuffle,
  setRepeat,
  seekToPosition,
} from '../../lib/spotify'
import { broadcastRefresh } from '../../lib/broadcaster'

function requireSession(sessionId: string) {
  const session = getSession(sessionId)
  if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' })
  return session
}

export const spotifyRouter = router({
  search: publicProcedure
    .input(z.object({ sessionId: z.string(), query: z.string().min(1) }))
    .query(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        return await searchTracks(input.sessionId, input.query)
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  queue: publicProcedure
    .input(z.object({ sessionId: z.string(), trackUri: z.string() }))
    .mutation(async ({ input }) => {
      const session = requireSession(input.sessionId)
      try {
        await queueTrack(input.sessionId, input.trackUri, session.deviceId)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  nowPlaying: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        return await getNowPlaying(input.sessionId)
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  getQueue: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        return await getQueue(input.sessionId)
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  getDevices: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        return await getDevices(input.sessionId)
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  setDevice: publicProcedure
    .input(z.object({ sessionId: z.string(), deviceId: z.string() }))
    .mutation(({ input }) => {
      requireSession(input.sessionId)
      updateSession(input.sessionId, { deviceId: input.deviceId })
      return { success: true }
    }),

  skipNext: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await skipNext(input.sessionId)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  skipPrevious: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await skipPrevious(input.sessionId)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  pause: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await pausePlayback(input.sessionId)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  resume: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await resumePlayback(input.sessionId)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  setVolume: publicProcedure
    .input(z.object({ sessionId: z.string(), volumePercent: z.number().min(0).max(100) }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await setVolume(input.sessionId, input.volumePercent)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  setShuffle: publicProcedure
    .input(z.object({ sessionId: z.string(), state: z.boolean() }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await setShuffle(input.sessionId, input.state)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  setRepeat: publicProcedure
    .input(z.object({ sessionId: z.string(), state: z.enum(['off', 'track', 'context']) }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await setRepeat(input.sessionId, input.state)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),

  seek: publicProcedure
    .input(z.object({ sessionId: z.string(), positionMs: z.number().min(0) }))
    .mutation(async ({ input }) => {
      requireSession(input.sessionId)
      try {
        await seekToPosition(input.sessionId, input.positionMs)
        void broadcastRefresh(input.sessionId)
        return { success: true }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) })
      }
    }),
})
