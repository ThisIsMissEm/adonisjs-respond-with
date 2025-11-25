import { ApplicationService } from '@adonisjs/core/types'
import type { RespondWithConfig } from '../src/types.js'
import { AcceptNegotiator } from '../src/acceptor.js'

export default class RespondWithProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    await import('../src/extension.js')
  }

  register() {
    this.app.container.singleton(AcceptNegotiator, async () => {
      const config = this.app.config.get<RespondWithConfig>('respond_with', {
        defaultHandler: 'error',
        mappings: {},
      })
      const logger = await this.app.container.make('logger')

      return new AcceptNegotiator(config, logger)
    })

    this.app.container.alias('respondWith.acceptNegotiator', AcceptNegotiator)
  }
}
