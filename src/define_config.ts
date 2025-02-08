import type { RespondWithOptions } from './types.js'

/**
 * Define the config for respondWith
 */
export function defineConfig(config: Partial<RespondWithOptions>): RespondWithOptions {
  return {
    defaultType: config.defaultType ?? 'error',
    additionalTypes: {
      ...config.additionalTypes,
    },
  }
}
