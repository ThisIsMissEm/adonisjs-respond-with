import type { AcceptNegotiator } from './acceptor.js'
import type Negotiator from 'negotiator'

export interface RespondWithConfig {
  defaultHandler: string | 'error'
  mappings: {
    [contentType: string]: string
  }
}

export type Handler = (matchedType?: string) => any
export type ResponseMatchers = Record<string, Handler> & { error?: never }

export interface NegotiateOptions<MatcherNames> {
  defaultHandler?: (MatcherNames & string) | 'error'
}

declare module '@adonisjs/core/http' {
  interface HttpRequest {
    negotiator: Negotiator
  }

  interface HttpResponse {
    negotiate<T extends ResponseMatchers>(matchers: T): ReturnType<T[keyof T]>
    negotiate<T extends ResponseMatchers>(
      matchers: T,
      options: NegotiateOptions<keyof T>
    ): ReturnType<T[keyof T]>
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'respondWith.acceptNegotiator': AcceptNegotiator
  }
}
