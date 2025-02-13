import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import type { RespondWithConfig } from './types'

/**
 * Define the config for respondWith
 */
export function defineConfig(config: Partial<RespondWithConfig>): RespondWithConfig {
  if (Object.hasOwnProperty.call(config, 'mappings')) {
    if (typeof config.mappings !== 'object' || Array.isArray(config.mappings)) {
      throw new InvalidArgumentsException('The "mappings" property must be an object if defined')
    }

    if (Object.hasOwnProperty.call(config.mappings, 'error')) {
      throw new InvalidArgumentsException(
        'The "mappings" property cannot contain "error" as a key, as this is a reserved type'
      )
    }
  }

  return {
    defaultHandler: config.defaultHandler ?? 'error',
    mappings: {
      ...config.mappings,
    },
  }
}
