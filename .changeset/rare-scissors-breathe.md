---
'@thisismissem/adonisjs-respond-with': patch
---

Fix issue with configuration not loading

In order to load `config/respond_with.ts`, I needed to ask config service for `respond_with` not `respondWith`, was tripped up by some of the magic.

This also adds trace level logging to this plugin when it handles requests.
