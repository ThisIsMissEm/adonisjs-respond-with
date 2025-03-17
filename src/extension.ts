import { Response } from '@adonisjs/core/http'
import type { ResponseMatchers, NegotiateOptions } from './types.js'
import { Negotiator } from './negotiator.js'
import { RuntimeException } from '@adonisjs/core/exceptions'

Response.macro('negotiate', async function <
  T extends ResponseMatchers,
>(this: Response, matchers: T, options?: NegotiateOptions<T>): Promise<void> {
  const negotiator: Negotiator = await this.ctx!.containerResolver.make(Negotiator)

  const matcherNames = Object.keys(matchers)
  const acceptedTypes = negotiator.getAcceptedTypes(matcherNames)

  const bestMatch = this.ctx!.request.accepts(acceptedTypes)

  this.ctx?.logger.trace({
    respondWith: {
      acceptHeader: this.ctx!.request.header('accept'),
      acceptedTypes,
      bestMatch,
      matchers: matcherNames,
    },
  })

  // If we support the matched content-type is known, execute it:
  if (bestMatch && acceptedTypes.includes(bestMatch)) {
    const handlerName = negotiator.getHandlerFromContentType(bestMatch, matcherNames)

    if (typeof handlerName === 'string' && typeof matchers[handlerName] === 'function') {
      await matchers[handlerName](bestMatch)
      return
    }
  }

  // Else, if we've a defaultType for the respondWith, execute it.
  if (options?.defaultHandler) {
    if (options.defaultHandler === 'error') {
      // Throw a 406 Unacceptable response, indicating the given content-type
      // could not be handled, as the overridden defaultHandler was set to error,
      // causing it to not cascade to the global defaultHandler handler
      // this.response.writeHead(406, 'Unacceptable').end('406 Unacceptable')
      this.notAcceptable()
      return
    }

    if (typeof matchers[options.defaultHandler] === 'function') {
      await matchers[options.defaultHandler]()
      return
      // The else branch here can only ever happen if someone's completely
      // ignored the typechecking, hence not covering it:
      /* c8 ignore next 5 */
    } else {
      throw new RuntimeException(
        `Could not find handler for response.negotiate when using default: ${options.defaultHandler}`
      )
    }
  }

  // Else if we have a global defaultHandler, and it's not an error response, and
  // we have a supported matcher for the default type, execute it.
  const defaultHandler = negotiator.getDefaultHandler()
  if (defaultHandler !== 'error' && typeof matchers[defaultHandler] === 'function') {
    await matchers[defaultHandler]()
    return
  }

  // Finally through a 406 Unacceptable response, indicating the given
  // content-type could not be handled.
  this.notAcceptable()
})
