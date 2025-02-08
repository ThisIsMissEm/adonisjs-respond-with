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
