import { ApplicationService } from '@adonisjs/core/types'
import { RespondWithOptions } from '../src/types'

export default class RespondWithProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    await import('../src/extension.js')
  }

  register() {
    this.app.container.singleton('respondWith', async (resolver) => {
      const configService = await resolver.make('config')
      const respondWithConfig = configService.get<RespondWithOptions>('respondWith')

      return respondWithConfig
    })
  }
}
