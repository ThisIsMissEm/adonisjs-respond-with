import { Response, Request } from '@adonisjs/core/http'
import type { ResponseMatchers, NegotiateOptions } from './types.js'
import { AcceptNegotiator } from './acceptor.js'
import { RuntimeException } from '@adonisjs/core/exceptions'
import Negotiator from 'negotiator'

Request.getter(
  'negotiator',
  function (this: Request): Negotiator {
    return new Negotiator(this.request)
  },
  true
)

Response.macro('negotiate', async function <
  T extends ResponseMatchers,
>(this: Response, matchers: T, options?: NegotiateOptions<T>): Promise<void> {
  const acceptor = await this.ctx!.containerResolver.make(AcceptNegotiator)
  const negotiator = this.ctx!.request.negotiator

  const { acceptedTypes, handlers } = acceptor.processMatchers(matchers)
  const preferredType = negotiator.mediaType(acceptedTypes) ?? null
  const mediaType = negotiator.mediaType()

  // We don't want to assert code coverage on debugging code:
  /* c8 ignore start */
  if (this.ctx?.logger.isLevelEnabled('trace')) {
    this.ctx?.logger.trace({
      respondWith: {
        acceptHeader: this.ctx!.request.header('accept'),
        acceptedTypes,
        preferredType,
        mediaType: mediaType ?? null,
        matchers: Object.keys(matchers),
        handlers: Object.fromEntries(
          handlers.entries().map(([contentType, handler]) => [contentType, handler.name])
        ),
      },
    })
  }
  /* c8 ignore stop */

  // If we support the preferred type, then execute the handler
  if (preferredType && handlers.has(preferredType)) {
    const handler = handlers.get(preferredType)
    if (typeof handler === 'function') {
      return await handler(preferredType)
    }
  }

  // If we don't support the exact preferred type, but do support the media
  // type, and have that handler, then execute it. This allows for
  // `application/ld+json; profile="https://www.w3.org/ns/activitystreams` to
  // execute the `application/ld+json` handler if no more specific handler
  // exists:
  if (!preferredType && mediaType && handlers.has(mediaType)) {
    const handler = handlers.get(mediaType)
    if (typeof handler === 'function') {
      return await handler(mediaType)
    }
  }

  // Else, if we've a defaultType for the respondWith, execute it.
  if (options?.defaultHandler) {
    if (options.defaultHandler === 'error') {
      // Throw a 406 Unacceptable response, indicating the given content-type
      // could not be handled, as the overridden defaultHandler was set to error,
      // causing it to not cascade to the global defaultHandler handler
      // this.response.writeHead(406, 'Unacceptable').end('406 Unacceptable')
      return this.notAcceptable()
    }

    const defaultHandler = matchers[options.defaultHandler]
    if (typeof defaultHandler === 'function') {
      return await defaultHandler()
    } else {
      // This else branch can only ever happen if someone's completely ignored
      // the typechecking:
      throw new RuntimeException(
        `Could not find handler for response.negotiate when using default: ${options.defaultHandler}`,
        { status: 406 }
      )
    }
  }

  // Else if we have a global defaultHandler, and it's an error response, return an error:
  const defaultHandler = acceptor.defaultHandler
  if (defaultHandler === 'error') {
    return this.notAcceptable()
  }

  // Else if we have a global defaultHandler, and it's not an error response, and
  // we have a supported handler for the default handler, execute it.
  const handler = matchers[defaultHandler]
  if (typeof handler === 'function') {
    return await handler()
  }

  // Finally fall through to a 406 Unacceptable response, indicating the given
  // content-type could not be handled.
  return this.notAcceptable()
})
