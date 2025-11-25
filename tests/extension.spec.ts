import { test } from '@japa/runner'
import sinon from 'sinon'

import { setupApp } from './helpers.js'
import { defineConfig } from '../src/define_config.js'
import Negotiator from 'negotiator'

test.group('Request negotiator', () => {
  test('returns a Negotiator instance', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'
    ctx.request.request.headers['accept-language'] = 'fr-FR,en-US'

    assert.instanceOf(ctx.request.negotiator, Negotiator)
    assert.includeOrderedMembers(ctx.request.negotiator.languages(), ['fr-FR', 'en-US'])
    assert.includeDeepOrderedMembers(ctx.request.negotiator.mediaTypes(), ['application/json'])

    await testUtils.app.terminate()
  })

  test('returns a singleton of the Negotiator', async ({ assert }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()
    const firstCall = ctx.request.negotiator
    const secondCall = ctx.request.negotiator

    assert.equal(
      firstCall,
      secondCall,
      'Accessing the negotiator multiple times returns the same instance'
    )

    await testUtils.app.terminate()
  })
})

test.group('Response negotiate', () => {
  test('with known handler', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var callback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      json: () => {
        return callback()
      },
    })

    assert.isTrue(callback.calledOnce, 'Invoked the json handler')

    await testUtils.app.terminate()
  })

  test('with unknown responder', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'text/html'

    var callback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      // not html:
      json: () => {
        return callback()
      },
    })

    assert.equal(callback.callCount, 0, 'Did not invoke the json handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')

    await testUtils.app.terminate()
  })

  test('without Accept header', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    // Explicitly don't set ctx.request.request.headers['accept']

    var callback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      json: () => {
        return callback()
      },
    })

    assert.equal(callback.callCount, 0, 'Did not invoke the json handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')

    await testUtils.app.terminate()
  })

  test('Returns the response from the handler', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()
    ctx.request.request.headers['accept'] = 'application/json'

    ctx.logger.debug(testCtx.title)
    const result = ctx.response.negotiate({
      json: () => {
        // Set a different status code
        ctx.response.status(201)
        return { test: 'ok' }
      },
    })

    assert.instanceOf(result, Promise, 'Should return a promise')
    assert.deepEqual(await result, { test: 'ok' }, 'Resolves to the json handler return value')
    assert.equal(ctx.response.getStatus(), 201, 'Status should be 200')

    await testUtils.app.terminate()
  })

  test('Additional Types with unsupported type that would require an additional type', async ({
    assert,
    test: testCtx,
  }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            // Explicitly not setting a mapping for application/unknown-type
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/unknown-type'

    var unknownCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      unknown: (contentType) => {
        return unknownCallback(contentType)
      },
    })

    assert.equal(unknownCallback.callCount, 0, 'Invoked the turbo handler')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')

    await testUtils.app.terminate()
  })

  test('Additional Types with registered type', async ({ assert, test: testCtx }) => {
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

    var turboCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      turbo: () => {
        return turboCallback()
      },
      html: () => {
        return htmlCallback()
      },
    })

    assert.isTrue(turboCallback.calledOnce, 'Invoked the turbo handler')
    assert.equal(htmlCallback.callCount, 0, 'Did not invoke the html handler')

    await testUtils.app.terminate()
  })

  test('Additional types with registered type but no handler', async ({
    assert,
    test: testCtx,
  }) => {
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

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      html: () => {
        return callback()
      },
      // explicitly no turbo handler
    })

    assert.equal(callback.callCount, 0, 'Does not invoke the html handler for a turbo request')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 unprocessable')

    await testUtils.app.terminate()
  })

  test('Additional types with multiple registered type mappings', async ({
    assert,
    test: testCtx,
  }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/api.v1+json': 'json',
            'application/ld+json': 'json',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/api.v1+json'

    var jsonCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
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

    await testUtils.app.terminate()
  })

  test('With application/ld+json using profile', async ({ assert, test: testCtx }) => {
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

    // This fails because the profile doesn't match:
    ctx.request.request.headers['accept'] =
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'

    var jsonCallback = sinon.fake()
    var htmlCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      json(contentType) {
        ctx.response.status(200)
        return jsonCallback(contentType)
      },
      html() {
        ctx.response.status(201)
        return htmlCallback()
      },
    })

    assert.equal(ctx.response.getStatus(), 200, 'Should return 200')
    assert.isTrue(jsonCallback.calledOnce, 'Invoked the json handler for a json-ld request')
    assert.equal(
      jsonCallback.firstCall.firstArg,
      'application/ld+json',
      'Passes the matched content-type to the handler'
    )
    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the html handler')

    await testUtils.app.terminate()
  })

  test('With different application/ld+json profiles', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"': 'as2',
            'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"': 'anno',
            'application/ld+json': 'json',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    // This fails because the profile doesn't match:
    ctx.request.request.headers['accept'] =
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'

    const jsonCallback = sinon.fake()
    const as2Callback = sinon.fake()
    const annoCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      json(contentType) {
        return jsonCallback(contentType)
      },
      as2(contentType) {
        return as2Callback(contentType)
      },
      anno(contentType) {
        return annoCallback(contentType)
      },
    })

    assert.isTrue(as2Callback.called)
    assert.isFalse(jsonCallback.called)
    assert.isFalse(annoCallback.called)

    assert.equal(
      as2Callback.firstCall.firstArg,
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    await testUtils.app.terminate()
  })

  test('Additional types with mappings overriding default matcher type', async ({
    assert,
    test: testCtx,
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

    ctx.logger.debug(testCtx.title)
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

    await testUtils.app.terminate()
  })

  test('Additional types with multiple registered type mappings overriding default type', async ({
    assert,
    test: testCtx,
  }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/ld+json': 'jsonld',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/ld+json, application/json'

    var jsonCallback = sinon.fake()
    var jsonldCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      json() {
        return jsonCallback()
      },
      jsonld() {
        return jsonldCallback()
      },
    })

    assert.isFalse(jsonCallback.called, 'Should not invoke the json handler for a json-ld request')
    assert.isTrue(jsonldCallback.called, 'Invoked the jsonld handler for a json-ld request')

    await testUtils.app.terminate()
  })

  test('Swapped type handlers', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
      config: {
        respond_with: defineConfig({
          mappings: {
            'application/xml': 'json',
            'application/json': 'xml',
          },
        }),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] = 'application/json'

    var jsonCallback = sinon.fake()
    var xmlCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      xml(contentType) {
        return xmlCallback(contentType)
      },
      json() {
        return jsonCallback()
      },
    })

    assert.isTrue(xmlCallback.called, 'Invoked the xml handler for a json request')
    assert.isFalse(
      jsonCallback.called,
      'Should not invoke the json handler for a json request due to swapped types'
    )
    assert.equal(xmlCallback.firstCall.firstArg, 'application/json')

    await testUtils.app.terminate()
  })

  test('default type responders with global default', async ({ assert, test: testCtx }) => {
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

    ctx.logger.debug(testCtx.title)
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

    await testUtils.app.terminate()
  })

  test('global default handler but the handler is not implemented', async ({
    assert,
    test: testCtx,
  }) => {
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

    var xmlCallback = sinon.fake()
    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      xml() {
        xmlCallback()
      },
      // explicitly no `json` or `html` handler
    })

    assert.isFalse(xmlCallback.called, 'xml handler should not be called.')
    assert.equal(ctx.response.getStatus(), 406, 'Should return 406 not acceptable')

    await testUtils.app.terminate()
  })

  test('default type responders with overridden default type responder', async ({
    assert,
    test: testCtx,
  }) => {
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

    ctx.logger.debug(testCtx.title)
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

    await testUtils.app.terminate()
  })

  test('default type with overridden default type to error', async ({ assert, test: testCtx }) => {
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

    ctx.logger.debug(testCtx.title)
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

    await testUtils.app.terminate()
  })

  test('default handler mapped to unknown handler function (typescript error)', async ({
    assert,
    test: testCtx,
  }) => {
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

    ctx.logger.debug(testCtx.title)
    assert.rejects(
      async () => {
        await ctx.response.negotiate(
          {
            html: () => {
              return htmlCallback()
            },
            // explicitly no `json` handler
          },
          // @ts-expect-error
          { defaultHandler: 'xml' }
        )
      },
      /RuntimeException/,
      'Could not find handler for response.negotiate when using default: xml'
    )

    assert.isFalse(htmlCallback.called, 'Should not invoke the html handler')

    await testUtils.app.terminate()
  })

  test('Multiple Accepts values', async ({ assert, test: testCtx }) => {
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

    ctx.logger.debug(testCtx.title)
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
      jsonCallback.firstCall.firstArg,
      'application/json',
      'Passes the matched content-type to the handler'
    )
    assert.equal(htmlCallback.callCount, 0, 'Should not invoke the html handler')

    await testUtils.app.terminate()
  })

  test('Multiple Accepts values with quality', async ({ assert, test: testCtx }) => {
    const { testUtils } = await setupApp({
      rcFileContents: {
        providers: () => import('../providers/respond_with.js'),
      },
    })

    const ctx = await testUtils.createHttpContext()

    ctx.request.request.headers['accept'] =
      'text/plain; q=0.5, text/html; q=0.6, application/json; q=0.1'

    var textCallback = sinon.fake()
    var jsonCallback = sinon.fake()

    ctx.logger.debug(testCtx.title)
    await ctx.response.negotiate({
      text(contentType) {
        textCallback(contentType)
      },
      json(contentType) {
        jsonCallback(contentType)
      },
      // html isn't handled even though it's of higher preference
    })

    assert.isTrue(textCallback.calledOnce, 'Invoked the text handler despite lower quality')
    assert.isFalse(jsonCallback.called)
    assert.equal(textCallback.firstCall.firstArg, 'text/plain')

    await testUtils.app.terminate()
  })
})
