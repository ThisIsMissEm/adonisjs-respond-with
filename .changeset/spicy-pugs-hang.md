---
'@thisismissem/adonisjs-respond-with': major
---

Upgrade to AdonisJS v7

Updates the following packages to their latest (v7-compatible) versions:

- `@adonisjs/assembler`
- `@adonisjs/core`
- `@adonisjs/eslint-config`
- `@adonisjs/prettier-config`
- `@adonisjs/tsconfig`

**Breaking changes:**

- Bumps `@adonisjs/core` peer dependency from `^6.2.0` to `^7.x`
- Requires Node.js `>=24.0.0` (previously `>=20.6.0`)
- Renamed `Request` to `HttpRequest` and `Response` to `HttpResponse` to match the AdonisJS v7 interface naming

**Internal changes:**

- Replaced `ts-node` with `@poppinss/ts-exec`, the TypeScript JIT compiler now used by AdonisJS v7
