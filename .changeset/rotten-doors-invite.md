---
'@thisismissem/adonisjs-respond-with': patch
---

Fix the README documenting an API that was removed in v2.0.0

The README still showed `request.respondWith({ … })`, which was renamed to
`response.negotiate({ … })` in v2.0.0. Following the README produced a
`Property 'respondWith' does not exist on type 'HttpRequest'` TypeScript error.

The README now documents the real API, and gains the sections it never had:
installation, configuration (`defaultHandler` and `mappings`), how handler names
resolve to content-types, the resolution order, handling content-types with
parameters, and `request.negotiator`.

It also documents that `Accept: */*` and a missing `Accept` header express no
preference and so fall through to the default handler — a `406` unless you set
`defaultHandler`, either in `config/respond_with.ts` or per call via the second
argument to `negotiate`.

No runtime changes.
