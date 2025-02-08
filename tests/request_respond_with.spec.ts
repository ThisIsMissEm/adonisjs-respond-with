import { test } from '@japa/runner'
import sinon from 'sinon'

import { setupApp } from './helpers.js'

test.group('Request respondWith', () => {
  test('with known handler', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var callback = sinon.fake()

    await ctx.request.respondWith({
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

    await ctx.request.respondWith({
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
        respondWith: {
          additionalTypes: {
            // Explicitly not setting this:
            // turbo: 'text/vnd.turbo-stream.html',
          },
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var turboCallback = sinon.fake()

    await ctx.request.respondWith({
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
        respondWith: {
          additionalTypes: {
            turbo: 'text/vnd.turbo-stream.html',
          },
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var callback = sinon.fake()

    await ctx.request.respondWith({
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
        respondWith: {
          additionalTypes: {
            turbo: 'text/vnd.turbo-stream.html',
          },
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/vnd.turbo-stream.html'

    var callback = sinon.fake()

    await ctx.request.respondWith({
      html: () => {
        return callback()
      },
      // explicitly no turbo handler
    })

    assert.equal(callback.callCount, 0, 'Does not invoke the html handler for a turbo request')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')
  })

  test('default type responders with global default', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respondWith: {
          defaultType: 'html',
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var callback = sinon.fake()

    await ctx.request.respondWith({
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
        respondWith: {
          defaultType: 'xml',
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var htmlCallback = sinon.fake()
    var xmlCallback = sinon.fake()

    await ctx.request.respondWith(
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
      { defaultType: 'html' }
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
        respondWith: {
          defaultType: 'html',
        },
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var htmlCallback = sinon.fake()

    await ctx.request.respondWith(
      {
        html: () => {
          ctx.response.status(200)
          return htmlCallback()
        },
        // explicitly no `json` handler
      },
      { defaultType: 'error' }
    )

    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the global default handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unacceptable')
  })
})
