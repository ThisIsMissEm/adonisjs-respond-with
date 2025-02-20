# @thisismissem/adonisjs-respond-with

## 2.0.0

### Major Changes

- [#19](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/19) [`b8b1dfa`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/b8b1dfa9949bf73c463e10d4f38c42b6e5f29f06) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Rework API to support multiple content-types mapping to one handler

  The previous API had the `additionalTypes` configuration mapping from the handler name to the content-type, in practice that doesn't work unless you make the value an array, since it'll be common to need to map multiple content-types to the one handler. For example: application/json and application/ld+json can both just be treated as json, but in the v1 API this wasn't possible, as doing:

  ```typescript
  export default defineConfig({
    defaultType: 'error',
    additionalTypes: {
      json: 'application/ld+json',
    },
  })
  ```

  Would result in never being able to handle `application/json` because that content-type was accepted through the fact that the handler name mapped to `application/json` through the mime-types library, which is used under the hood in Adonis.

  Instead, the new API is:

  ```typescript
  export default defineConfig({
    defaultHandler: 'error',
    mappings: {
      'application/ld+json': 'json',
    },
  })
  ```

  The `json` handler automatically accepts `application/json` just like `accepts('json')` would give you, but it'd also accept `application/ld+json` through the mapping.

  Whilst arguably this could create interesting "accepted" content-types where the handler name was something in the mime-types database, i.e., `mime.lookup('example')` mapping to something that you don't want to handle, these cases should be fairly rare, where as not having to define a mapping between common content-types and handler names gives better ergonomics.

  ## Handlers receive the matched content-type

  The handler will also now receive an augment of the "matched content-type", which is useful when the content-type includes additional information that may affect processing. You can access this in handlers as:

  ```typescript
  response.negotiate({
    jsonld(matchedContentType) {
      /* do something */
    },
  })
  ```

  If there is no match, and the handler is invoked due to it being the default, then this argument will be undefined.

  One caveat is that the parameters to the `Accept` header are not part of the matching, only the content-type, so having the mappings of both `application/ld+json` and `application/ld+json; profile="..."` to the `jsonld` handler will result in the matched content-type being which ever content-type occurs first in the mappings:

  ```typescript
  export default defineConfig({
    defaultHandler: 'error',
    mappings: {
      'application/ld+json': 'json'
      'application/ld+json; profile="..."': 'json'
    },
  })
  ```

  ```typescript
  export default defineConfig({
    defaultHandler: 'error',
    mappings: {
      'application/ld+json; profile="..."': 'json'
      'application/ld+json': 'json'
    },
  })
  ```

  The first will give the matched content type as `application/ld+json` where as the second will give `application/ld+json; profile="..."` even if the request's `Accept` header value was `application/ld+json` without the profile parameter.

  ## Other API Changes

  The original API had the method as `request.respondWith` which felt a little bit weird, given there is a `response` property on `HttpContext`. In v2.0.0, we've switched to `response.negotiate` which is more correct as an extension point: it's the response that we're negotiating, not the request.

  The configuration option of `defaultType` was renamed to `defaultHandler` since the value for this option was the handler name to invoke for the default handler, not the content-type. This clarifies that in order to use the `json` handler as the default for all requests instead of `error`, you'd use the following configuration:

  ```typescript
  export default defineConfig({
    defaultHandler: 'json',
    mappings: {},
  })
  ```

  When the configuration property was called `defaultType` one might expect the value to be the content-type and not the handler name, so the following configuration wouldn't have called the `json` handler:

  ```typescript
  export default defineConfig({
    defaultType: 'application/json',
    mappings: {},
  })
  ```

### Patch Changes

- [#20](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/20) [`d1d861e`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/d1d861e133812b41802dfe4c9e1cb33a3f78a4e5) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix issue with configuration not loading

  In order to load `config/respond_with.ts`, I needed to ask config service for `respond_with` not `respondWith`, was tripped up by some of the magic.

  This also adds trace level logging to this plugin when it handles requests.

- [#17](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/17) [`e093326`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/e0933268939c0661be08c1263eb3f677ef0d3734) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix issue with necessary files being in package

  The previous change using `.npmignore` didn't work because of the `files` directive in the `package.json`

## 1.0.1

### Patch Changes

- [#16](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/16) [`16aea41`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/16aea41629f6f1ffae7ef5b39a8caf51b944e0b7) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix issue with provider export not being found

- [#15](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/15) [`223a0f5`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/223a0f5fbde523a19c98b5639a81a131e4cbace2) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Fix issue with config file containing additional whitespace

- [#13](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/13) [`0a03241`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/0a032414426f35921b2f9f32b1ce6b6ebc501b29) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Remove unnecessary files from package releases

## 1.0.0

### Major Changes

- [#11](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/11) [`fd4f4f1`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/fd4f4f1eecc5a11763e63874e857ce28412db91c) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Initial release of `@thisismissem/adonisjs-respond-with`

  This release brings the basic functionality described in the README.md file to your adonis project.

## 0.0.1

### Patch Changes

- [#7](https://github.com/ThisIsMissEm/adonisjs-respond-with/pull/7) [`c5b8c3d`](https://github.com/ThisIsMissEm/adonisjs-respond-with/commit/c5b8c3d08a6ceca71abf13c51a6a90faba76cfb3) Thanks [@ThisIsMissEm](https://github.com/ThisIsMissEm)! - Prepare for initial release
