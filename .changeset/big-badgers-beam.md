---
'@thisismissem/adonisjs-respond-with': major
---

Rework to use negotiator directly instead of accepts

This allows us to correctly handle `application/ld+json; profile="https://www.w3.org/ns/activitystreams"` with a registered `application/ld+json` mapping to a handler name. Technically a mime-type with parameters and a mime-type without are distinct mime-types, but for our uses, we actually want to treat them as the same, and cascade to just the mime-type without parameters.
