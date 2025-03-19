---
'@thisismissem/adonisjs-respond-with': minor
---

Support return the response from the handler function

We've now added the ability to have the response from the handler pass through the negotiate method, allowing for better integration when working with views from Edge.js

For example, we can now do:

```typescript
export default class TestController {
  async index({ response, view }: HttpContext) {
    return response.negotiate(
      {
        json() {
          response.json({ test: 'ok' })
        },
        html() {
          return view.render('test/index')
        },
      },
      { defaultHandler: 'html' }
    )
  }
```

When previously this would raise a typescript error, as noted in [#24](https://github.com/ThisIsMissEm/adonisjs-respond-with/issues/24).
