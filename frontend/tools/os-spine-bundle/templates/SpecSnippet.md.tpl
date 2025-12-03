### `__OS_OBJECT_ID__`

- **Component:** `__OS_OBJECT_NAME__`
- **Location:** `workspaces/__OS_OBJECT_NAME__.tsx`
- **Purpose:** OS-level primitive (domain-neutral)

**Props:**
```ts
interface __OS_OBJECT_NAME__Props {
  workspaceId?: string;
}
```

**Emits:**
- `object_selected` via `emitIntent`
  ```ts
  {
    workspaceId: string | undefined,
    objectId: '__OS_OBJECT_ID__',
    objectType: '__OS_OBJECT_NAME__'
  }
  ```

**Tests:** `workspaces/__tests__/__OS_OBJECT_NAME__.test.tsx`
