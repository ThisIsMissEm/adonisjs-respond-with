import { IgnitorFactory } from '@adonisjs/core/factories/core/ignitor'
import { TestUtilsFactory } from '@adonisjs/core/factories/core/test_utils'
import { defineConfig, targets } from '@adonisjs/core/logger'
import { existsSync } from 'node:fs'
import { truncate } from 'node:fs/promises'

export const BASE_URL = new URL('../tmp/', import.meta.url)
export const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, BASE_URL).href)
  }
  return import(filePath)
}

const enableDebug = process.env['DEBUG_TESTS'] && process.env['DEBUG_TESTS'] === 'true'
const logFile = new URL('../test-logs.ndjson', import.meta.url).pathname
if (enableDebug && existsSync(logFile)) {
  await truncate(logFile)
}

/**
 * Setup an AdonisJS app for testing
 */
export async function setupApp(parameters: Parameters<IgnitorFactory['merge']>[0] = {}) {
  const factory = new IgnitorFactory().withCoreProviders().withCoreConfig().merge(parameters)

  // Note: when this is enabled, the test runner will hang open for a bit.
  if (enableDebug) {
    // Fix for pino and max listeners, since a new logger is created per test case:
    process.setMaxListeners(Infinity)

    factory.merge({
      config: {
        logger: defineConfig({
          default: 'app',
          loggers: {
            app: {
              enabled: true,
              name: 'test',
              level: 'trace',
              transport: {
                targets: targets()
                  .push(
                    targets.file({
                      destination: new URL('../test-logs.ndjson', import.meta.url).pathname,
                      append: true,
                    })
                  )
                  .toArray(),
              },
            },
          },
        }),
      },
    })
  }

  const ignitor = factory.create(BASE_URL, { importer: IMPORTER })

  const testUtils = new TestUtilsFactory().create(ignitor)
  await testUtils.app.init()
  await testUtils.app.boot()
  await testUtils.boot()

  return { testUtils, app: testUtils.app }
}
