import { test } from '@japa/runner'
import sinon from 'sinon'

import { setupApp } from './helpers.js'
import { defineConfig } from '../src/define_config.js'

test.group('Request respond_with', () => {
  test('with known handler', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var callback = sinon.fake()

    await ctx.response.negotiate({
      json: () => {
        return callback()
      },
    })

    assert.isTrue(callback.calledOnce, 'Invoked the json handler')
  })

  test('with unknown responder', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/html'

    var callback = sinon.fake()

    await ctx.response.negotiate({
      // not html:
      json: () => {
        return callback()
      },
    })

    assert.equal(callback.callCount, 0, 'Did not invoke the json handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')
  })

  test('without Accept header', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    // Explicitly don't set ctx.request.request.headers['accept']

    var callback = sinon.fake()

    await ctx.response.negotiate({
      json: () => {
        return callback()
      },
    })

    assert.equal(callback.callCount, 0, 'Did not invoke the json handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')
  })

  test('Additional Types with unsupported type that would require an additional type', async ({
    assert,
  }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            // Explicitly not setting this:
            // 'text/vnd.turbo-stream.html': 'turbo',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var turboCallback = sinon.fake()

    await ctx.response.negotiate({
      turbo: () => {
        return turboCallback()
      },
    })

    assert.equal(turboCallback.callCount, 0, 'Invoked the turbo handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')
  })

  test('Additional Types with registered type', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'text/vnd.turbo-stream.html': 'turbo',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var callback = sinon.fake()

    await ctx.response.negotiate({
      turbo: () => {
        return callback()
      },
    })

    assert.isTrue(callback.calledOnce, 'Invoked the turbo handler')
  })

  test('Additional types with registered type but no handler', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'text/vnd.turbo-stream.html': 'turbo',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var callback = sinon.fake()

    await ctx.response.negotiate({
      html: () => {
        return callback()
      },
      // explicitly no turbo handler
    })

    assert.equal(callback.callCount, 0, 'Does not invoke the html handler for a turbo request')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')
  })

  test('Additional types with multiple registered type mappings', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/api.v1+json': 'json',
            'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"': 'json',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/api.v1+json'

    var jsonCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    await ctx.response.negotiate({
      json(contentType) {
        return jsonCallback(contentType)
      },
      html() {
        return htmlCallback()
      },
    })

    assert.isTrue(jsonCallback.calledOnce, 'Invoked the json handler for a json-ld request')
    assert.equal(
      jsonCallback.firstCall.args[0],
      'application/api.v1+json',
      'Passes the matched content-type to the handler'
    )
    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the html handler')
  })

  test('Additional types with multiple registered type mappings overriding default type', async ({
    assert,
  }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/ld+json': 'json',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var jsonCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    await ctx.response.negotiate({
      json() {
        return jsonCallback()
      },
      html() {
        return htmlCallback()
      },
    })

    assert.isTrue(jsonCallback.calledOnce, 'Invoked the json handler for a json-ld request')
    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the html handler')
  })

  test('default type responders with global default', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          defaultHandler: 'html',
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var callback = sinon.fake()

    await ctx.response.negotiate({
      html: () => {
        ctx.response.status(200)
        return callback()
      },
      // explicitly no `json` handler
    })

    assert.equal(
      callback.callCount,
      1,
      'Invoked the html handler for an unknown request content type'
    )
    assert.equal(ctx.response.getStatus(), 200, 'Should return 200')
  })

  test('default type responders with overridden default type responder', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          defaultHandler: 'xml',
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var htmlCallback = sinon.fake()
    var xmlCallback = sinon.fake()

    await ctx.response.negotiate(
      {
        html: () => {
          ctx.response.status(200)
          return htmlCallback()
        },
        xml: () => {
          return xmlCallback()
        },
        // explicitly no `json` handler
      },
      { defaultHandler: 'html' }
    )

    assert.equal(
      htmlCallback.callCount,
      1,
      'Invoked the html handler for an unknown request content type'
    )
    assert.equal(xmlCallback.callCount, 0, 'Does not invoke the global default xml handler')
    assert.equal(ctx.response.getStatus(), 200, 'Should return 200')
  })

  test('default type with overridden default type to error', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          defaultHandler: 'html',
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var htmlCallback = sinon.fake()

    await ctx.response.negotiate(
      {
        html: () => {
          ctx.response.status(200)
          return htmlCallback()
        },
        // explicitly no `json` handler
      },
      { defaultHandler: 'error' }
    )

    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the global default handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unacceptable')
  })

  test('Multiple Accepts values', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/api.v1+json': 'json',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json, application/api.v1+json'

    var jsonCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    await ctx.response.negotiate({
      json(contentType) {
        jsonCallback(contentType)
      },
      html() {
        htmlCallback()
      },
    })

    assert.isTrue(jsonCallback.calledOnce, 'Invoked the json handler for a json-ld request')
    assert.equal(
      jsonCallback.firstCall.args[0],
      'application/json',
      'Passes the matched content-type to the handler'
    )
    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the html handler')
  })
})
