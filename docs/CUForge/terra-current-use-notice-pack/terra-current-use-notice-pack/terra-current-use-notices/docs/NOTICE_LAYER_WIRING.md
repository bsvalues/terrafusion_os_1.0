# Current Use Notice Layer Wiring

## Backend

Register services:

```csharp
services.AddTerraCurrentUseNotices();
```

Add controller discovery for:

```txt
TerraFusion.Modules.CurrentUse.Controllers.CurrentUseNoticeController
```

Endpoint:

```txt
POST /api/forge/current-use/notices/preview
```

## Frontend

Replace the simple `NoticePreviewPanel` with `NoticePreviewPanelUpgrade`.

Pass overview:

```tsx
<NoticePreviewPanelUpgrade overview={overview} />
```

## Guardrail

Phase 1 supports preview only.

No final issuance.
No recorder integration.
No e-signature.
No automated legal determination.

Every generated preview must display:

```txt
Draft generated for assessor review. This document is not final until reviewed, approved, and issued by authorized county staff.
```
