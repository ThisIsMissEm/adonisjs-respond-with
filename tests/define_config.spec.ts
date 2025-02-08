import { test } from '@japa/runner'

import { defineConfig } from '../index.js'

test.group('defineConfig', () => {
  test('returns a valid configuration object', ({ assert }) => {
    const config = defineConfig({})

    assert.deepEqual(config, {
      defaultType: 'error',
      additionalTypes: {},
    })
  })

  test('returns configuration with defaultType', ({ assert }) => {
    const config = defineConfig({
      defaultType: 'html',
    })

    assert.deepEqual(config, {
      defaultType: 'html',
      additionalTypes: {},
    })
  })

  test('returns configuration with additionalTypes', ({ assert }) => {
    const config = defineConfig({
      additionalTypes: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })

    assert.deepEqual(config, {
      defaultType: 'error',
      additionalTypes: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })
  })

  test('returns configuration with additionalTypes and defaultType', ({ assert }) => {
    const config = defineConfig({
      defaultType: 'test',
      additionalTypes: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })

    assert.deepEqual(config, {
      defaultType: 'test',
      additionalTypes: {
        turbo: 'text/vnd.turbo-stream.html',
      },
    })
  })

  test('throw an configuration error with additionalTypes containing "error" key', ({ assert }) => {
    assert.throws(() => {
      defineConfig({
        additionalTypes: {
          error: 'this/should.not.be.allowed',
        },
      })
    }, 'The "additionalTypes" property cannot contain "error" as a key, as this is a reserved type')
  })

  test('does not throw a configuration error with empty additionalTypes', ({ assert }) => {
    assert.doesNotThrow(() => {
      defineConfig({
        additionalTypes: {},
      })
    })
  })

  test('throw a configuration error with additionalTypes as an array', ({ assert }) => {
    assert.throws(() => {
      defineConfig({
        // @ts-expect-error
        additionalTypes: [],
      })
    }, 'The "additionalTypes" property must be an object if defined')
  })

  test('throw a configuration error with empty config', ({ assert }) => {
    assert.doesNotThrow(() => {
      defineConfig({})
    })
  })
})
