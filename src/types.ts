import type { Negotiator } from './negotiator'
export interface RespondWithConfig {
  defaultHandler: string | 'error'
  mappings: {
    [contentType: string]: string
  }
}

export type Handler = (matchedType?: string) => Promise<void> | void
export type ResponseMatchers = Record<string, Handler> & { error?: never }

type RecordKeys<T> = keyof T & string
export interface NegotiateOptions<T extends ResponseMatchers> {
  defaultHandler?: RecordKeys<T> | 'error'
}

declare module '@adonisjs/core/http' {
  interface Response {
    negotiate<T extends ResponseMatchers>(matchers: T): Promise<void>
    negotiate<T extends ResponseMatchers>(matchers: T, options: NegotiateOptions<T>): Promise<void>
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'respondWith.negotiator': Negotiator
  }
}
