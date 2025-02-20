import { ApplicationService } from '@adonisjs/core/types'
import type { RespondWithConfig } from '../src/types.js'
import { Negotiator } from '../src/negotiator.js'

export default class RespondWithProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    await import('../src/extension.js')
  }

  register() {
    this.app.container.singleton(Negotiator, async () => {
      const config = this.app.config.get<RespondWithConfig>('respond_with', {
        defaultHandler: 'error',
        mappings: {},
      })

      return new Negotiator(config)
    })

    this.app.container.alias('respondWith.negotiator', Negotiator)
  }
}
