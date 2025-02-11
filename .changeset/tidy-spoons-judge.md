---
'@thisismissem/adonisjs-respond-with': patch
---

Fix issue with necessary files being in package

The previous change using `.npmignore` didn't work because of the `files` directive in the `package.json`
