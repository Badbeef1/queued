import { z } from 'zod'

export const CreateSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(100),
  hostName: z.string().min(1, 'Host name is required').max(50),
})

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostName: z.string(),
  deviceId: z.string().optional(),
  createdAt: z.string(),
})

export type Session = z.infer<typeof SessionSchema>
