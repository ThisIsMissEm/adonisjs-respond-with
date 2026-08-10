# AdonisJS Respond With

A small plugin for AdonisJS to make responding with different content-types easier.

It extends the `HttpResponse` class with a `negotiate` method, which takes a record of key-value pairs where the key is a content-type (or a name that maps to one) and the value is a function that handles the response.

## Installation

```sh
pnpm add @thisismissem/adonisjs-respond-with mime-types
node ace configure @thisismissem/adonisjs-respond-with
```

`mime-types` is a required peer dependency. The `configure` command creates `config/respond_with.ts` and registers the provider in `adonisrc.ts`.

Requires AdonisJS v7 and Node.js 24 or later.

## Usage

```typescript
export default class ExampleController {
  async show({ response, view }: HttpContext) {
    return response.negotiate({
      html: () => view.render('pages/example'),
      json: () =>
        response.json({
          example: true,
        }),
    })
  }
}
```

Or with short-hand using [object literal concise method syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#syntax):

```typescript
export default class ExampleController {
  async show({ response, view }: HttpContext) {
    return response.negotiate({
      html() {
        return view.render('pages/example')
      },
      json() {
        return response.json({
          example: true,
        })
      },
    })
  }
}
```

This package gives:

- a cleaner API for handling the `Accept` header content-negotiation
- automatically responds with a `406 Not Acceptable` error by default
- allows for automatically responding with a default response type (the default is `'error'`, which gives the behavior above).

## API

### `response.negotiate(matchers, options?)`

Picks a handler from `matchers` based on the request's `Accept` header and invokes it. Returns a promise that resolves to whatever the handler returned, so you can `return` it directly from a controller:

```typescript
const result = await response.negotiate({
  json: () => ({ test: 'ok' }),
})
// result === { test: 'ok' }
```

Handlers receive the matched content-type as their first argument, which is useful when several content-types map to one handler:

```typescript
return response.negotiate({
  json(contentType) {
    // 'application/json', 'application/ld+json', …
  },
})
```

#### Handler names

Each key in `matchers` is resolved to a content-type via [`mime-types`](https://www.npmjs.com/package/mime-types), so common extensions work without configuration:

| Handler name | Content-type          |
| ------------ | --------------------- |
| `json`       | `application/json`    |
| `html`       | `text/html`           |
| `text`       | `text/plain`          |
| `xml`        | `application/xml`     |
| `csv`        | `text/csv`            |
| `jsonld`     | `application/ld+json` |
| `md`         | `text/markdown`       |

Names that `mime-types` doesn't recognise (such as `turbo` or `as2`) need a [mapping](#custom-content-types). A handler with no known content-type and no mapping is skipped, and a warning is logged.

#### Options

| Option           | Type                        | Description                                                                                                                                 |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultHandler` | `keyof matchers \| 'error'` | Overrides the configured `defaultHandler` for this call only. Use `'error'` to force a `406` instead of falling back to the global default. |

```typescript
return response.negotiate(
  {
    html: () => view.render('pages/example'),
    xml: () => response.send(toXml(data)),
  },
  { defaultHandler: 'html' }
)
```

### Resolution order

1. If the client's preferred content-type has a handler, that handler runs.
2. Otherwise, if a handler is registered for the client's top media type _without_ its parameters, that handler runs. This is what lets `application/ld+json; profile="…"` cascade to an `application/ld+json` handler.
3. Otherwise, the per-call `defaultHandler` runs — or a `406` is sent if it is `'error'`.
4. Otherwise, the configured `defaultHandler` runs — or a `406` is sent if it is `'error'`.
5. Otherwise, a `406 Not Acceptable` is sent.

Quality values are respected: the highest-quality type you actually have a handler for wins, not the highest-quality type the client asked for.

#### Clients that don't express a preference

`Accept: */*`, and a request with no `Accept` header at all, express no preference, so there is nothing to negotiate. Both go straight to the default handler, which means a `406 Not Acceptable` under the default `defaultHandler: 'error'`:

```typescript
// Accept: */*  →  406, the json handler is not invoked
return response.negotiate({
  json: () => response.json({ example: true }),
})
```

If you're wanting to respond to HTML requests by default, you'll want to change `config/respond_with.ts` to have:

```typescript
export default defineConfig({
  defaultHandler: 'html',
})
```

Or for JSON APIs:

```typescript
export default defineConfig({
  defaultHandler: 'json',
})
```

This is deliberate: negotiation is strict by default, and a client that will take anything hasn't told you which representation it wants. It's worth knowing about because `fetch()` without an `Accept` header and `curl` both send `Accept: */*`.

You can also choose a default representation for those clients per call:

```typescript
// Accept: */*  →  invokes the json handler
return response.negotiate(
  {
    html: () => view.render('pages/example'),
    json: () => response.json({ example: true }),
  },
  { defaultHandler: 'json' }
)
```

The per-call option wins over the configured one, so a route that genuinely requires an explicit `Accept` can opt back into strictness with `{ defaultHandler: 'error' }`.

### `request.negotiator`

The underlying [`Negotiator`](https://www.npmjs.com/package/negotiator) instance for the request, created lazily and memoized per request. Useful for negotiating things `negotiate` doesn't cover, such as languages or encodings:

```typescript
const language = request.negotiator.language(['en', 'fr', 'de'])
```

## Configuration

`config/respond_with.ts`:

```typescript
import { defineConfig } from '@thisismissem/adonisjs-respond-with'

export default defineConfig({
  defaultHandler: 'error',
  mappings: {},
})
```

| Key              | Type                     | Default   | Description                                                                                           |
| ---------------- | ------------------------ | --------- | ----------------------------------------------------------------------------------------------------- |
| `defaultHandler` | `string \| 'error'`      | `'error'` | Handler name to fall back to when no handler matches. `'error'` sends a `406 Not Acceptable` instead. |
| `mappings`       | `Record<string, string>` | `{}`      | Maps content-types to handler names, for types `mime-types` doesn't know or that you want to rename.  |

`mappings` cannot use `error` as a handler name — it is reserved.

Note that a configured `defaultHandler` only applies when the matchers passed to `negotiate` actually include a handler by that name. If `defaultHandler` is `'html'` and a given call has no `html` handler, that call falls through to a `406`.

## Custom content-types

`mappings` maps a content-type to a handler name. Use it for types `mime-types` doesn't recognise:

```typescript
export default defineConfig({
  mappings: {
    'text/vnd.turbo-stream.html': 'turbo',
  },
})
```

```typescript
return response.negotiate({
  turbo: () => response.send(turboStream),
  html: () => view.render('pages/example'),
})
```

Several content-types can share one handler:

```typescript
export default defineConfig({
  mappings: {
    'application/api.v1+json': 'json',
    'application/ld+json': 'json',
  },
})
```

Mappings take precedence over the `mime-types` lookup, so they can also redirect a well-known type to a different handler.

### Content-types with parameters

Technically a media type with parameters and one without are distinct media types, but for content negotiation you usually want them to cascade. A mapping for the bare type handles both:

```typescript
mappings: {
  'application/ld+json': 'json',
}
```

Here `application/ld+json; profile="https://www.w3.org/ns/activitystreams"` falls through to the `json` handler. To handle profiles separately, map them explicitly; the more specific mapping wins when the client's `Accept` matches its parameters:

```typescript
mappings: {
  'application/ld+json; profile="https://www.w3.org/ns/activitystreams"': 'as2',
  'application/ld+json; profile="http://www.w3.org/ns/anno.jsonld"': 'anno',
  'application/ld+json': 'json',
}
```

## Debugging

Set your logger to the `trace` level to see the negotiation decisions — the `Accept` header, the accepted types, the preferred type, and which handlers were registered.

## The alternative

If you didn't use this package, you'd need to write code like the following:

```typescript
export default class ExampleController {
  async show({ request, response, view }: HttpContext) {
    switch (request.accepts(['json', 'html'])) {
      case 'json':
        return response.json({
          example: true,
        })
      case 'html':
        return view.render('pages/example')
      default:
      // decide yourself
    }
  }
}
```

## License

[MIT](./LICENSE.md)
