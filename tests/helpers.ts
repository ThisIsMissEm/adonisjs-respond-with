import { IgnitorFactory } from '@adonisjs/core/factories/core/ignitor'
import { TestUtilsFactory } from '@adonisjs/core/factories/core/test_utils'

export const BASE_URL = new URL('./tmp/', import.meta.url)
export const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, BASE_URL).href)
  }
  return import(filePath)
}

/**
 * Setup an AdonisJS app for testing
 */
export async function setupApp(parameters: Parameters<IgnitorFactory['merge']>[0] = {}) {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge(parameters)
    .create(BASE_URL, { importer: IMPORTER })

  // const app = ignitor.createApp('web')
  // await app.init().then(() => app.boot())

  const testUtils = new TestUtilsFactory().create(ignitor)
  await testUtils.app.init()
  await testUtils.app.boot()
  await testUtils.boot()

  return { testUtils, app: testUtils.app }
}
