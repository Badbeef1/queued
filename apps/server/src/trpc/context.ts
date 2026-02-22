import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type Context = Record<string, never>

export function createContext(_opts: FetchCreateContextFnOptions): Context {
  return {}
}
