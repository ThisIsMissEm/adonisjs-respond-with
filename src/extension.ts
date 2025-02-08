import { Request } from '@adonisjs/core/http'
import type { ResponseMatchers, RespondWithOptions, MatcherResponse } from './types.js'

declare module '@adonisjs/core/http' {
  interface Request {
    respondWith(matchers: ResponseMatchers): MatcherResponse
    respondWith(
      matchers: ResponseMatchers,
      options: { defaultType?: Exclude<keyof ResponseMatchers, number> }
    ): MatcherResponse
  }
}

Request.macro(
  'respondWith',
  async function (
    this: Request,
    matchers: ResponseMatchers,
    options?: { defaultType?: Exclude<keyof ResponseMatchers, number> }
  ) {
    const defaultOptions: RespondWithOptions =
      (await this.ctx?.containerResolver.make('respondWith')) ?? {}
    const additionalTypes = defaultOptions.additionalTypes ?? []

    // This allows users to define custom named content-types.
    //
    // `turbo() => turbo.append()` but the turbo type isn't known to accepts(), so
    // we need to remap it from `turbo` to `text/vnd.turbo-stream.html`
    const mappedTypes: Record<string, string> = {}
    const matchedTypes = Object.keys(matchers)
    const acceptedTypes = matchedTypes.map((type) => {
      if (additionalTypes[type]) {
        // allow the inverse mapping
        mappedTypes[additionalTypes[type]] = type
        return additionalTypes[type]
      }

      return type
    })

    const bestMatch = this.accepts(acceptedTypes)

    // If we support the matched content-type is known, execute it:
    if (bestMatch && acceptedTypes.includes(bestMatch)) {
      if (typeof matchers[bestMatch] === 'function') {
        return await matchers[bestMatch]()
      } else if (mappedTypes[bestMatch] && typeof matchers[mappedTypes[bestMatch]]) {
        return await matchers[mappedTypes[bestMatch]]()
      }
    }
    // Else, if we've a defaultType for the respondWith, execute it.
    if (options?.defaultType) {
      if (typeof matchers[options.defaultType] === 'function') {
        return await matchers[options.defaultType]()
      }

      if (options.defaultType === 'error') {
        // Throw a 406 Unacceptable response, indicating the given content-type
        // could not be handled, as the overridden defaultType was set to error,
        // causing it to not cascade to the global defaultType handler
        return this.response.writeHead(406, 'Unacceptable').end('406 Unacceptable')
      }
    }

    // Else if we have a global defaultType, and it's not an error response, and
    // we have a supported matcher for the default type, execute it.
    if (
      defaultOptions.defaultType &&
      defaultOptions.defaultType !== 'error' &&
      typeof matchers[defaultOptions.defaultType] === 'function'
    ) {
      return await matchers[defaultOptions.defaultType]()
    }

    // Finally through a 406 Unacceptable response, indicating the given
    // content-type could not be handled.
    this.response.writeHead(406, 'Unacceptable').end('406 Unacceptable')
  }
)
