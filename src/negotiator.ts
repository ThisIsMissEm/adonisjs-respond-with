import * as mime from 'mime-types'

import { RespondWithConfig } from './types'

export class Negotiator {
  private contentTypes: Map<string, string>
  private handlerTypes: Map<string, string[]>

  constructor(public config: RespondWithConfig) {
    this.config = config

    this.contentTypes = new Map<string, string>()
    this.handlerTypes = new Map<string, string[]>()

    // This allows users to define custom named content-types.
    //
    // `turbo() => turbo.append()` but the turbo type isn't known to accepts(),
    // so we need to remap it from `turbo` to `text/vnd.turbo-stream.html`
    //
    // In the case of json-ld, we can treat the response as `json` which
    // accepts() does know, however we need to tell it that we accept
    // application/ld+json and that it's mapped to the json handler
    for (const [contentType, handlerName] of Object.entries(this.config.mappings)) {
      const handlerTypes = this.handlerTypes.get(handlerName)
      if (handlerTypes === undefined) {
        const contentTypes = [contentType]

        // handle the case of the mapping overriding a known mime-type, e.g., a
        // mapping of "application/ld+json": "json" would override the
        // "application/json" handling for "json" without this:
        const mimeType = mime.lookup(handlerName)
        if (mimeType) {
          contentTypes.push(mimeType)

          this.contentTypes.set(mimeType, handlerName)
        }

        this.contentTypes.set(contentType, handlerName)
        this.handlerTypes.set(handlerName, contentTypes)
      } else {
        this.contentTypes.set(contentType, handlerName)
        this.handlerTypes.set(handlerName, handlerTypes.concat(contentType))
      }
    }
  }

  getDefaultHandler(): string {
    return this.config.defaultHandler
  }

  getAcceptedTypes(matcherNames: string[]): string[] {
    const acceptedTypes: string[] = []
    for (const name of matcherNames) {
      const handlerContentTypes = this.handlerTypes.get(name)
      if (handlerContentTypes) {
        acceptedTypes.push(...handlerContentTypes)
      } else {
        acceptedTypes.push(name)
      }
    }
    return acceptedTypes
  }

  getHandlerFromContentType(contentType: string, matcherNames: string[]): string | undefined {
    const knownHandler = this.contentTypes.get(contentType)
    if (typeof knownHandler === 'string') {
      return knownHandler
    } else if (matcherNames.includes(contentType)) {
      return contentType
    }
  }
}
