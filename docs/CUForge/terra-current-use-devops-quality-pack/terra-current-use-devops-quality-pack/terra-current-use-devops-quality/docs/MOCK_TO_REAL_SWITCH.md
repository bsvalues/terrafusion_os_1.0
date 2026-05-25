# Current Use Mock-to-Real Switch

## Rule

Every slice must enter through an API facade. UI components should not know whether data is mocked or real.

## Frontend Switch

Use a config flag:

```ts
const USE_MOCK_CURRENT_USE = true;
```

Then expose:

```ts
export const currentUseApi = USE_MOCK_CURRENT_USE
  ? mockCurrentUseApi
  : realCurrentUseApi;
```

## Promotion Order

1. overview
2. evidence metadata
3. timeline
4. rollback calculation
5. policy resolution
6. trace
7. notice preview

Do not turn on all real APIs at once.
