import { Request } from '@adonisjs/core/http'
import type { ResponseMatchers, RespondWithOptions, MatcherResponse } from './types.js'

declare module '@adonisjs/core/http' {
  interface Request {
    respondWith(matchers: ResponseMatchers): MatcherResponse
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

    // This allows users to define custom named content-types.
    //
    // `turbo() => turbo.append()` but the turbo type isn't known to accepts(), so
    // we need to remap it from `turbo` to `text/vnd.turbo-stream.html`
    const mappedTypes: Record<string, string> = {}
    const matchedTypes = Object.keys(matchers)
    const acceptedTypes = matchedTypes.map((type) => {
      if (defaultOptions.additionalTypes[type]) {
        // allow the inverse mapping
        mappedTypes[defaultOptions.additionalTypes[type]] = type
        return defaultOptions.additionalTypes[type]
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
    // Else, if we've a defaultType for the respondWith, and it's not an error
    // response, execute it.
    if (options?.defaultType && options.defaultType !== 'error') {
      return await matchers[options.defaultType]()
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
