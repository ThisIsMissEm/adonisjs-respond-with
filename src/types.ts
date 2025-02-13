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
