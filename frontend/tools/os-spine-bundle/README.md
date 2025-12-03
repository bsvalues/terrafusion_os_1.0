# OS Spine Bundle – Scaffold Kit

This toolkit helps you scaffold new OS objects, intents, and other OS spine primitives with correct wiring by default.

## Quick Start

```bash
# Scaffold a new OS object
npm run scaffold:os-object MyNewOSObject my_new_os_object
```

This creates:
- `src/terrafusion-os/workspaces/MyNewOSObject.tsx` – Component wired to intent spine
- `src/terrafusion-os/workspaces/__tests__/MyNewOSObject.test.tsx` – Tests for the component
- Prints a spec snippet to paste into `docs/os-workspace-spine-spec.md`

## What Gets Generated

### Component (`MyNewOSObject.tsx`)

A domain-neutral OS primitive already wired to:
- `useOmniIntent` hook
- `emitIntent('object_selected', ...)` on interaction
- `data-testid` for testing

### Test (`MyNewOSObject.test.tsx`)

Vitest tests covering:
- Renders with correct test ID
- Emits `object_selected` intent on click

### Spec Snippet

A markdown snippet to paste into `docs/os-workspace-spine-spec.md` documenting:
- Object ID and name
- Location
- Props contract
- Intent emissions

## After Scaffolding

The script will remind you to:

1. **Register in catalog** – Add entry to `core/osObjects/catalog.ts`
2. **Update spec** – Paste snippet into `docs/os-workspace-spine-spec.md`
3. **Extend catalog tests** – Add ID check to `catalog.test.ts`
4. **Run tests** – `npx vitest run src/terrafusion-os`

## Adding New Intents

When your OS object needs a **new intent type**:

1. Open `templates/IntentMapping.example.ts` for the pattern
2. Add the new intent to `IntentType` in `core/state/OmniIntentContext.tsx`
3. Handle it in `emitIntent` switch statement
4. Map it to activity in `core/activity/intentActivityBridge.ts`

## Adding Activity Logging

When your intent needs to be **logged to the activity provider**:

1. Open `templates/ActivityMapping.example.ts` for the pattern
2. Add a case in `recordWorkspaceActivityFromIntent()`
3. Use the correct `WorkspaceActivityType` and `WorkspaceActivityKind`

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run scaffold:os-object` | Scaffold new OS object |
| `npm run test:os:smoke` | Run all OS spine tests |
| `npm run spine:docs` | Print the OS spine spec |

## Templates

Located in `tools/os-spine-bundle/templates/`:

| Template | Purpose |
|----------|---------|
| `OSObject.tsx.tpl` | Component template |
| `OSObject.test.tsx.tpl` | Test template |
| `SpecSnippet.md.tpl` | Documentation snippet |
| `IntentMapping.example.ts` | How to add new intents |
| `ActivityMapping.example.ts` | How to log intents to activity |

## Customization

Edit templates to change default behavior. Placeholders:
- `__OS_OBJECT_NAME__` → PascalCase component name
- `__OS_OBJECT_ID__` → snake_case object ID

## Related Docs

- [os-workspace-spine-spec.md](../../../docs/os-workspace-spine-spec.md)
- [OS_SPINE_CONTRIBUTOR_GUIDE.md](../../../docs/OS_SPINE_CONTRIBUTOR_GUIDE.md)
- [AGENT_ONBOARDING_OS_SPINE.md](../../../docs/AGENT_ONBOARDING_OS_SPINE.md)
