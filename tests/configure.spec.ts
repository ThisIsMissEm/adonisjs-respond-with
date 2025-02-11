import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'
import { BASE_URL } from './helpers.js'

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  group.each.timeout(0)

  test('adds provider and config stub', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    await fs.create('.env', '')
    await fs.createJson('tsconfig.json', {})
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await app.container.make('ace')

    const command = await ace.create(Configure, ['../index.ts'])
    await command.exec()

    await assert.fileContains(
      'adonisrc.ts',
      '@thisismissem/adonisjs-respond-with/providers/respond_with'
    )

    await assert.fileExists('config/respond_with.ts')

    await assert.fileContains('config/respond_with.ts', [
      `import { defineConfig } from '@thisismissem/adonisjs-respond-with'`,
      `defaultType: 'error',`,
      `additionalTypes: {},`,
    ])

    // verify no additional whitespace exists:
    const contents = await assert.fs.contents('config/respond_with.ts')
    await assert.fileEquals('config/respond_with.ts', contents.trim(), 'Ensure no extra whitespace')
  })
})
