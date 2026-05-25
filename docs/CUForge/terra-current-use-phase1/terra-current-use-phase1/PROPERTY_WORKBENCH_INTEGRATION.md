# Property Workbench Integration

Add this import wherever parcel workbench tabs are registered:

```ts
import { CurrentUseWorkbenchTab } from '@/modules/terra-current-use';
```

Register the tab:

```tsx
{
  id: 'current-use',
  label: 'Current Use',
  suite: 'terraforge',
  moduleId: 'terra-current-use',
  render: ({ parcelId }) => <CurrentUseWorkbenchTab parcelId={parcelId} />,
}
```

Guardrail: Property Workbench owns placement. `terra-current-use` owns only tab content.
