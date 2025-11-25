import { test } from '@japa/runner'

import { defineConfig } from '../index.js'

test.group('defineConfig', () => {
  test('returns a valid configuration object', ({ assert }) => {
    const config = defineConfig({})

    assert.deepEqual(config, {
      defaultHandler: 'error',
      mappings: {},
    })
  })

  test('returns configuration with defaultHandler', ({ assert }) => {
    const config = defineConfig({
      defaultHandler: 'html',
    })

    assert.deepEqual(config, {
      defaultHandler: 'html',
      mappings: {},
    })
  })

  test('returns configuration with mappings', ({ assert }) => {
    const config = defineConfig({
      mappings: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })

    assert.deepEqual(config, {
      defaultHandler: 'error',
      mappings: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })
  })

  test('returns configuration with mappings and defaultHandler', ({ assert }) => {
    const config = defineConfig({
      defaultHandler: 'test',
      mappings: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })

    assert.deepEqual(config, {
      defaultHandler: 'test',
      mappings: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })
  })

  test('throw an configuration error with mappings containing "error" key', ({ assert }) => {
    assert.throws(() => {
      defineConfig({
        mappings: {
          error: 'this/should.not.be.allowed',
        },
      })
    }, 'The "mappings" property cannot contain "error" as a key, as this is a reserved type')
  })

  test('does not throw a configuration error with empty mappings', ({ assert }) => {
    assert.doesNotThrow(() => {
      defineConfig({
        mappings: {},
      })
    })
  })

  test('throw a configuration error with mappings as an array', ({ assert }) => {
    assert.throws(() => {
      defineConfig({
        // @ts-expect-error We're deliberately passing an invalid value type for mappings:
        mappings: [],
      })
    }, 'The "mappings" property must be an object if defined')
  })

  test('throw a configuration error with empty config', ({ assert }) => {
    assert.doesNotThrow(() => {
      defineConfig({})
    })
  })
})
