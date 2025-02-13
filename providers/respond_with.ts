import { ApplicationService } from '@adonisjs/core/types'
import { NegotiateOptions, RespondWithConfig, ResponseMatchers } from '../src/types'
import { Negotiator } from '../src/negotiator'

declare module '@adonisjs/core/http' {
  interface Response {
    negotiate<T extends ResponseMatchers>(matchers: T): Promise<void>
    negotiate<T extends ResponseMatchers>(matchers: T, options: NegotiateOptions<T>): Promise<void>
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'respondWith.negotiator': Negotiator
  }
}

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
