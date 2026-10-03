# @boutique/shared

Code used by more than one backend service, as an npm workspace package.

- `requireUser`, `requireAdmin`, `requireInternal` — Express middleware for
  JWT access tokens and service-to-service calls
- `readAuth`, `getJwtSecret`, `hasInternalToken` — the helpers behind them

```ts
import { requireUser } from '@boutique/shared';
```

Services import the compiled `dist/`. Each service's `prebuild`, `predev` and
`pretest` scripts build this package first, and each service Dockerfile copies
it into the image.
