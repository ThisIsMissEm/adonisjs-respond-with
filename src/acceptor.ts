import * as mime from 'mime-types'

import { Handler, RespondWithConfig, ResponseMatchers } from './types.js'
import { Logger } from '@adonisjs/core/logger'
import app from '@adonisjs/core/services/app'

type Matcher = {
  acceptedTypes: string[]
  handlers: Map<string, Handler>
}

export class AcceptNegotiator {
  private cache: WeakMap<ResponseMatchers, Matcher>
  private handlerTypes: Map<string, string[]>

  constructor(
    public config: RespondWithConfig,
    protected logger: Logger
  ) {
    this.config = config

    this.cache = new WeakMap()
    this.handlerTypes = new Map<string, string[]>()

    // This allows users to define custom named content-types.
    //
    // `turbo() => turbo.append()` but the turbo type isn't known to mime-types,
    // so we need to create a mapping for from `text/vnd.turbo-stream.html` to `turbo`
    for (const [contentType, handlerName] of Object.entries(this.config.mappings)) {
      const handlerTypes = this.handlerTypes.get(handlerName)
      if (handlerTypes === undefined) {
        this.handlerTypes.set(handlerName, [contentType])
      } else {
        this.handlerTypes.set(handlerName, handlerTypes.concat(contentType))
      }
    }

    // We don't want to assert code coverage on debugging code:
    /* c8 ignore start */
    if (logger.isLevelEnabled('trace')) {
      logger.trace(
        {
          respondWith: {
            handlerTypes: Array.from(this.handlerTypes.keys()),
          },
        },
        'Initialized respond with'
      )
    }
    /* c8 ignore end */
  }

  get defaultHandler(): string {
    return this.config.defaultHandler
  }

  processMatchers<T extends ResponseMatchers>(matchers: T): Matcher {
    // Don't cache the matchers in dev, as this will cause issues if they're changed:
    if (!app.inDev) {
      const cached = this.cache.get(matchers)
      if (cached) {
        return cached
      }
    }

    const uncached = this.process(matchers)
    if (!app.inDev) {
      this.cache.set(matchers, uncached)
    }
    return uncached
  }

  private process<T extends ResponseMatchers>(matchers: T): Matcher {
    const names = Object.keys(matchers)
    const unknownTypes = new Set<string>()
    const acceptedTypes = new Set<string>()
    const handlers = new Map<string, Handler>()

    for (const name of names) {
      const knownTypes = this.handlerTypes.get(name)
      if (knownTypes) {
        knownTypes.forEach((knownType) => {
          if (!handlers.has(knownType)) {
            acceptedTypes.add(knownType)
            handlers.set(knownType, matchers[name])
          }
        })
      } else {
        unknownTypes.add(name)
      }
    }

    for (const name of names) {
      const mimeType = mime.lookup(name)
      if (mimeType) {
        acceptedTypes.add(mimeType)
        unknownTypes.delete(name)

        if (handlers.has(mimeType)) {
          if (handlers.get(mimeType) !== matchers[name]) {
            this.logger.error(
              { mimeType, handler: name, originalHandler: handlers.get(mimeType)!.name },
              'Duplicate handler found for mime-type'
            )
          }
          continue
        }

        handlers.set(mimeType, matchers[name])
      }
    }

    if (unknownTypes.size > 0) {
      this.logger.warn(
        {
          handlers: Array.from(unknownTypes.values()),
        },
        'Failed to detect mime-types for handlers, make sure you add custom handler types via the respondWith configuration'
      )
    }

    return { acceptedTypes: Array.from(acceptedTypes.values()).concat('*/*'), handlers }
  }
}
