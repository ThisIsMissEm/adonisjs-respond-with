import { InvalidArgumentsException } from '@adonisjs/core/exceptions'
import type { RespondWithOptions } from './types'

/**
 * Define the config for respondWith
 */
export function defineConfig(config: Partial<RespondWithOptions>): RespondWithOptions {
  if (Object.hasOwnProperty.call(config, 'additionalTypes')) {
    if (typeof config.additionalTypes !== 'object' || Array.isArray(config.additionalTypes)) {
      throw new InvalidArgumentsException(
        'The "additionalTypes" property must be an object if defined'
      )
    }

    if (Object.hasOwnProperty.call(config.additionalTypes, 'error')) {
      throw new InvalidArgumentsException(
        'The "additionalTypes" property cannot contain "error" as a key, as this is a reserved type'
      )
    }
  }

  return {
    defaultType: config.defaultType ?? 'error',
    additionalTypes: {
      ...config.additionalTypes,
    },
  }
}
