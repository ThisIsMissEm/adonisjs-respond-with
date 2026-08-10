---
'@thisismissem/adonisjs-respond-with': patch
---

Improve return type of `response.negotiate`

Changed the return type from `any` to `ReturnType<T[keyof T]>` to accurately reflect the actual return type of the handlers passed to `negotiate`.
