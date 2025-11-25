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
  interface Request {
    negotiator: Negotiator
  }

  interface Response {
    negotiate<T extends ResponseMatchers>(matchers: T): any
    negotiate<T extends ResponseMatchers>(matchers: T, options: NegotiateOptions<keyof T>): any
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'respondWith.acceptNegotiator': AcceptNegotiator
  }
}
