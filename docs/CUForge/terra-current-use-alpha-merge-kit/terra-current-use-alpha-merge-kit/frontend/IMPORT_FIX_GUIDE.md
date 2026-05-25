# Frontend Import Fix Guide

Because generated packs were produced independently, imports may need normalization.

## Standard Module Root

Use:

```ts
@/modules/terra-current-use
```

## Internal Imports

Prefer relative imports inside the module:

```ts
import { currentUseApi } from '../api/currentUseApi';
```

## Shared Components

If a slice imports:

```ts
import { Panel } from './shared';
```

but lives outside core, either:

1. copy `shared.tsx` into that slice, or
2. import from core shared:

```ts
import { Panel } from '@/modules/terra-current-use/components/shared';
```

## Rule

Fix imports before adding new behavior.
