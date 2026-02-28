import { z } from 'zod'

export const TrackSchema = z.object({
  uri: z.string(),
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: z.object({
    name: z.string(),
    images: z.array(z.object({ url: z.string(), width: z.number(), height: z.number() })),
  }),
  duration_ms: z.number(),
})

export type Track = z.infer<typeof TrackSchema>

export const DeviceSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  type: z.string(),
  is_active: z.boolean(),
  volume_percent: z.number().nullable(),
})

export type Device = z.infer<typeof DeviceSchema>

export const NowPlayingSchema = z.object({
  isPlaying: z.boolean(),
  track: TrackSchema.nullable(),
  progressMs: z.number().nullable(),
})

export type NowPlaying = z.infer<typeof NowPlayingSchema>

export const SearchQuerySchema = z.object({
  sessionId: z.string(),
  query: z.string().min(1),
})

export const QueueTrackSchema = z.object({
  sessionId: z.string(),
  trackUri: z.string(),
})

export const SetDeviceSchema = z.object({
  sessionId: z.string(),
  deviceId: z.string(),
})

export const SessionStateSchema = z.object({
  nowPlaying: NowPlayingSchema,
  queue: z.array(TrackSchema),
})

export type SessionState = z.infer<typeof SessionStateSchema>
