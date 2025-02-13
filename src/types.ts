import type { Negotiator } from './negotiator.js'

export interface RespondWithConfig {
  defaultHandler: string | 'error'
  mappings: {
    [contentType: string]: string
  }
}

export type Handler = (matchedType?: string) => Promise<void> | void
export type ResponseMatchers = Record<string, Handler> & { error?: never }

export interface NegotiateOptions<MatcherNames> {
  defaultHandler?: (MatcherNames & string) | 'error'
}

declare module '@adonisjs/core/http' {
  interface Response {
    negotiate<T extends ResponseMatchers>(matchers: T): Promise<void>
    negotiate<T extends ResponseMatchers>(
      matchers: T,
      options: NegotiateOptions<keyof T>
    ): Promise<void>
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'respondWith.negotiator': Negotiator
  }
}
