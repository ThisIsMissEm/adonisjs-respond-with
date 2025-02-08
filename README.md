# AdonisJS Respond With

A small plugin for Adonis.js to make responding with different content-types easier.

## API

This package extends the Request class to add a respondWith method, which takes a record of key-value pairs where the key is the accepted content-type, and the value is a callable function that handles the response.

## Example Usage

```typescript
export default class ExampleController {
  async show({ request, response, view }: HttpContext) {
    request.respondWith({
      html(): view.render('pages/example'),
      json(): response.json({
        example: true,
      }),
    })
  }
}
```

This package gives:

- a cleaner API for handling the `Accept` header content-negotiation
- automatically responds with a `406 Unacceptable` error by default
- allows for automatically responding with a default response type (the default is `'error'`, which gives the behavior above).

## The alternative

If you didn't use this package, you'd need to write code like the following:

```typescript
export default class ExampleController {
  async show({ request, response, view }: HttpContext) {
    switch (request.accepts(['json', 'html'])) {
      case 'json':
        return response.json({
          example: true,
        }),
      case 'html':
        return view.render('pages/example')
      default:
        // decide yourself
    }
  }
}
```
