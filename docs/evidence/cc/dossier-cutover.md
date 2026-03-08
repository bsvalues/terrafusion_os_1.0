# CC Lane Evidence: Dossier Cutover (Phase 2)

**Lane:** CC
**Date:** 2026-03-07
**Scope:** TerraDossier — transition from mock/fallback data to real backend API for parcel details; mock document management disabled with "coming in R2" state.

---

## Section 1: Parcel Details — REAL

Parcel details are served entirely from the real backend via the `useDossierDetails` hook.

### Data Flow

```
PropertyDossier.tsx
  -> useDossierDetails(parcelId)
    -> dossierService.getDetails(parcelId, options)
      -> GET /api/dossier/parcels/{parcelId}/details
        with X-Correlation-ID header
        with ?include=, ?levyLimit=, ?noteLimit= query params
```

### Real Data Sections Rendered

The `PropertyDossier.tsx` component renders four BentoGrid cards, all from real backend data:

1. **ParcelContextHeader** — displays parcel ID and suite branding
2. **PropertySection** — address, parcel number, property type, year built, assessed value, market value, land/improvement split, tax year, class code, use code, neighborhood
3. **ValuationSection** — total value, category breakdown with amounts and percentages
4. **LevySection** — levy count, taxing district, levy amount, tax rate, purpose, tax year
5. **NotesSection** — note headers only (PII-redacted: metadata, no content)

All sections are nullable — the UI renders "Not included in this request" placeholders when a section is null (selective `?include=` support).

### Correlation ID Tracing

Every request generates an `X-Correlation-ID` header. The response header is echoed and displayed in the UI as a copyable badge. The hook exposes `correlationId` for trace linking.

### Fallback Removal

`dossierService.ts` line 247-249 contains the tombstone comment:

```
// NOTE: DEFAULT fallback data removed in CC-14 (R1 Week 3).
// All service methods now propagate errors from the real backend.
```

All service methods (`searchDocuments`, `getDocument`, `searchEvidence`, `getChainOfCustody`, `getStats`, `getDetails`, `getEvidenceSnapshot`) call the real backend with bearer auth. No fallback data exists.

---

## Section 2: Document Management — DISABLED

Mock documents have been completely removed. The `PropertyDossier.tsx` component renders a disabled state at lines 445-453:

```tsx
<BentoCard title="Document Management" variant="form">
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <div className="text-3xl mb-2 opacity-50">📁</div>
    <p className="tf-text-tertiary font-medium">Document Management</p>
    <p className="tf-text-dim text-sm mt-1">
      Document storage and retrieval coming in R2
    </p>
  </div>
</BentoCard>
```

### Grep Evidence

- `MOCK_DOCUMENTS` grep across `frontend/` = **0 matches**
- `DossierDocument` grep across `frontend/` = **6 matches** in 2 files:
  - `dossierService.ts` (4 hits) — type definition and service method signature only (no mock data)
  - `DocumentsModule.tsx` (2 hits) — type import for the R2 document management module (not rendered in R1 dossier tab)

No mock document arrays, no fake document generation, no hardcoded document data.

---

## Ticket Status

| Ticket | Description | Status |
|--------|-------------|--------|
| CC-DOS-01 | Parcel details via real backend (useDossierDetails) | **CLOSED** |
| CC-DOS-02 | Mock document removal, Section 2 disabled | **CLOSED** |
| CC-DOS-03 | Fallback removal from dossierService.ts (CC-14) | **CLOSED** |

---

## Verification

- `tsc` passes
- `useDossierDetails` hook uses `dossierService.getDetails()` which calls `GET /api/dossier/parcels/{parcelId}/details`
- No fallback data in dossierService.ts (CC-14 tombstone at line 247)
- Document Management section renders "coming in R2" placeholder, no mock data

---

**Files:**
- `frontend/apps/os-shell/src/pages/workbench/tabs/PropertyDossier.tsx`
- `frontend/apps/os-shell/src/hooks/useDossierDetails.ts`
- `frontend/apps/os-shell/src/services/dossierService.ts`

**Verified by:** Claude Code (CC lane agent)
