export type MatcherResponse = unknown | Promise<unknown>
export type Matcher = () => MatcherResponse

export interface ResponseMatchers {
  [contentType: Exclude<string, 'error'>]: Matcher
}

export interface RespondWithOptions {
  defaultType: string | 'error'
  additionalTypes: {
    [name: Exclude<string, 'error'>]: string
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    respondWith: RespondWithOptions
  }
}
