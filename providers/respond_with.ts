import { ApplicationService } from '@adonisjs/core/types'
import { RespondWithConfig } from '../src/types'
import { RuntimeException } from '@adonisjs/core/exceptions'
import { configProvider } from '@adonisjs/core'
import { Negotiator } from '../src/negotiator.js'

export default class RespondWithProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    await import('../src/extension.js')
  }

  register() {
    this.app.container.singleton('respondWith.negotiator', async () => {
      const config = this.app.config.get<RespondWithConfig>('respondWith', {
        defaultHandler: 'error',
        mappings: {},
      })

      return new Negotiator(config)
    })
  }
}
