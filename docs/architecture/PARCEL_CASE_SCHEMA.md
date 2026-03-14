# TerraFusion OS — Parcel Case Schema

> **Document B** · Phase 0 Architecture · v2.0
> **Status**: CANONICAL — defines every data element tracked on a single parcel
> **Locked decisions respected**: TF-050, TF-052, ADR-0001 (tab order), ADR-0002 (one writer per domain)
> **Last updated**: 2026-03-14

---

## Purpose

This document defines every data element tracked on a single parcel — the schema contract for the Property Workbench. It specifies what data each Workbench tab and suite needs, who writes it, who reads it, and how it maps to the parcel lifecycle. Every field has exactly one write owner. Cross-lane writes happen only via TerraTrace.

---

## 1. Identity

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `parcelId` | string | OS Core | All | `Property.ParcelId` / `PropertyAssessment.ParcelId` (Data) | Primary key. County-scoped. Format: county-specific (e.g., Benton `1-0529-100-0022-000`) |
| `countyId` | GUID | OS Core | All | `Property.CountyId` | Sovereign county isolation key |
| `legalDescription` | string | OS Core (CAMA projection) | All | `PropertyAssessment.LegalDescription` (Data) | Metes-and-bounds or lot/block/plat |
| `taxParcelNumber` | string | OS Core | All | `Property.ParcelNumber` | Alternate parcel identifier |
| `situsAddress` | Address | OS Core (CAMA projection) | All | `Property.Address` / `PropertyAssessment.PropertyAddress` (Data) | Physical location |
| `situsCity` | string | OS Core | All | `PropertyAssessment.PropertyCity` (Data) | City name |
| `situsZip` | string | OS Core | All | `PropertyAssessment.PropertyZip` (Data) | ZIP code |
| `propertyClass` | enum | OS Core (CAMA projection) | All | `Property.PropertyType` / `PropertyAssessment.PropertyType` (Data) | Residential / Commercial / Industrial / Agricultural / Exempt / Mixed |
| `useCode` | string | OS Core (CAMA projection) | All | `PropertyAssessment.PropertyUseCode` (Data) | Detailed property use code per DOR standards |
| `neighborhood` | string | Atlas / OS Core | Forge, Atlas, Summary | `PropertyAssessment.Neighborhood` (Data) / `ComparableSale.Neighborhood` | Neighborhood code for comp grouping |
| `mapYear` | number | OS Core | All | `Property.TaxYear` / `PropertyAssessment.AssessmentYear` (Data) | Assessment cycle year |

---

## 2. Ownership

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `owners[]` | OwnerRecord[] | OS Core (CAMA projection) | All | **GAP** | Array supports multiple owners |
| `owners[].name` | string | OS Core | All | `Property.OwnerName` (single-value) / `PropertyAssessment.OwnerName` (Data) | **PII** — never appears in TerraTrace payloads. Backend stores single owner, not array. |
| `owners[].ownershipType` | enum | OS Core | All | **GAP** | Primary / Joint / Trust / LLC / Estate |
| `owners[].percentOwned` | decimal | OS Core | All | **GAP** | Ownership fraction |
| `owners[].mailingAddress` | Address | OS Core | Dais (notices), Summary | `PropertyAssessment.OwnerMailingAddress` (Data, single-value) | **PII** |
| `owners[].acquiredDate` | date | OS Core | Forge, Summary | **GAP** | Date of ownership acquisition |
| `owners[].deedReference` | string | OS Core | Dossier, Summary | **GAP** (partial: `ClerkDocument.RecordingNumber` links via parcel) | Recording number / document reference |

---

## 3. Land

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `totalAcres` | decimal | OS Core (CAMA) | All | `PropertyAssessment.LandAcreage` (Data) / `ParcelMaster.ParcelAreaAcres` (Data) | Total parcel acreage |
| `totalSqFt` | number | OS Core (CAMA) | All | `CamaCharacteristic.LandAreaSqft` / `ParcelMaster.ParcelAreaSqft` (Data) | Total parcel square footage |
| `landSegments[]` | LandSegment[] | Forge | Summary, Atlas | **GAP** | CAMA land segments with individual values |
| `landSegments[].useCode` | string | Forge | Summary | **GAP** | DOR land use code |
| `landSegments[].acres` | decimal | Forge | Summary, Atlas | **GAP** | Segment acreage |
| `landSegments[].ratePerAcre` | currency | Forge | Summary | **GAP** | Base land rate |
| `landSegments[].adjustedValue` | currency | Forge | Summary | **GAP** | After adjustments |
| `landSegments[].adjustments[]` | Adjustment[] | Forge | Summary | **GAP** | View, topography, access, etc. |
| `zoningCode` | string | OS Core (CAMA) | Atlas, Forge, Summary | `CamaCharacteristic.LandZone` / `PropertyAssessment.Zoning` (Data) | Current zoning designation |
| `floodZone` | string | Atlas | Forge, Summary | **GAP** | FEMA flood zone designation |
| `soilType` | string | Atlas | Forge | **GAP** | Soil classification (ag parcels) |
| `frontage` | decimal | OS Core (CAMA) | Forge | **GAP** | Road frontage in feet |
| `waterfront` | boolean | OS Core (CAMA) | Forge, Atlas | **GAP** | Waterfront flag |

---

## 4. Improvements

### 4a. Buildings

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `buildings[]` | Building[] | Forge | All | `CamaCharacteristic` (one row per building per year) | Each building on parcel |
| `buildings[].buildingId` | string | Forge | All | `CamaCharacteristic.Id` | Sequential building identifier |
| `buildings[].yearBuilt` | number | Forge | All | `CamaCharacteristic.YearBuilt` | Original construction year |
| `buildings[].yearRemodeled` | number | Forge | Summary, Forge | **GAP** | Most recent remodel year |
| `buildings[].qualityClass` | enum | Forge | All | `CamaCharacteristic.QualityGrade` | Construction quality grade |
| `buildings[].conditionRating` | enum | Forge | All | `CamaCharacteristic.ConditionGrade` | Physical condition (Excellent to Poor) |
| `buildings[].grossSqFt` | number | Forge | All | `CamaCharacteristic.SquareFeet` | Total building square footage |
| `buildings[].livingSqFt` | number | Forge | Summary | **GAP** (partial: `ComparableSale.GrossLivingArea`) | Above-grade living area |
| `buildings[].stories` | decimal | Forge | Summary | `CamaCharacteristic.Stories` | Number of stories (1, 1.5, 2, etc.) |
| `buildings[].bedrooms` | number | Forge | Summary, Forge | `CamaCharacteristic.Bedrooms` | Bedroom count |
| `buildings[].bathrooms` | decimal | Forge | Summary, Forge | `CamaCharacteristic.Bathrooms` | Bathroom count (full + half) |
| `buildings[].garageType` | enum | Forge | Summary | **GAP** | Attached / Detached / None |
| `buildings[].garageSqFt` | number | Forge | Summary | `CamaCharacteristic.GarageSqft` | Garage square footage |
| `buildings[].basement` | enum | Forge | Summary | **GAP** | Full / Partial / Crawl / None |
| `buildings[].basementFinishedSqFt` | number | Forge | Summary | **GAP** (partial: `CamaCharacteristic.BasementSqft` exists but is total, not finished) | Finished basement area |
| `buildings[].hvacType` | string | Forge | Forge | `CamaCharacteristic.HvacType` | Heating/cooling system type |
| `buildings[].roofType` | string | Forge | Forge | `CamaCharacteristic.RoofType` | Roof material and style |
| `buildings[].exteriorWall` | string | Forge | Forge | `CamaCharacteristic.ExteriorWall` | Exterior wall material |
| `buildings[].foundation` | string | Forge | Forge | `CamaCharacteristic.Foundation` | Foundation type |
| `buildings[].rcnld` | currency | Forge | Summary | `ValuationRecord.Rcnld` | Replacement Cost New Less Depreciation |
| `buildings[].physicalDepreciation` | decimal | Forge | Forge | `ValuationRecord.DepreciationPercent` | Physical depreciation percentage |
| `buildings[].functionalObsolescence` | decimal | Forge | Forge | `CamaCharacteristic.FunctionalObsolescence` | Functional obsolescence percentage |
| `buildings[].economicObsolescence` | decimal | Forge | Forge | `CamaCharacteristic.ExternalObsolescence` | Economic obsolescence percentage |

### 4b. Outbuildings / Other Improvements

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `outbuildings[]` | Outbuilding[] | Forge | Summary, Forge | **GAP** | Sheds, barns, pools, etc. |
| `outbuildings[].type` | string | Forge | Summary | **GAP** | Building type (shed, barn, pool, deck, etc.) |
| `outbuildings[].yearBuilt` | number | Forge | Summary | **GAP** | Construction year |
| `outbuildings[].sqFt` | number | Forge | Summary | **GAP** | Square footage |
| `outbuildings[].condition` | enum | Forge | Summary | **GAP** | Condition rating |
| `outbuildings[].contributoryValue` | currency | Forge | Summary | **GAP** | Value contribution to parcel |

### 4c. Sketches / Photos

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `sketches[]` | SketchRef[] | Forge | Summary, Forge, Dossier | **GAP** (partial: `DossierDocument` with type filter) | Building floor plan sketches |
| `sketches[].buildingId` | string | Forge | All | **GAP** | Links to building record |
| `sketches[].fileRef` | URI | Forge | Forge, Dossier | `DossierDocument.StoragePath` (via type filter) | Reference to sketch artifact |
| `sketches[].capturedDate` | date | Forge | Forge | `DossierDocument.UploadedAt` (via type filter) | Date sketch was created/updated |
| `photos[]` | PhotoRef[] | Forge | All | **GAP** (partial: `DossierDocument` with type filter) | Parcel and building photos |
| `photos[].photoType` | enum | Forge | All | **GAP** | Front / Rear / Aerial / Interior / Street |
| `photos[].fileRef` | URI | Forge | All | `DossierDocument.StoragePath` (via type filter) | Reference to photo artifact |
| `photos[].capturedDate` | date | Forge | All | `DossierDocument.UploadedAt` (via type filter) | Photo date |
| `photos[].capturedBy` | string | Forge | Forge | `DossierDocument.UploadedBy` (via type filter) | Photographer (appraiser ID) |

---

## 5. Sales History

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `sales[]` | SaleRecord[] | OS Core (CAMA projection) | All | `ComparableSale` (one per sale) | Every recorded sale |
| `sales[].saleDate` | date | OS Core | All | `ComparableSale.SaleDate` | Date of sale |
| `sales[].salePrice` | currency | OS Core | All | `ComparableSale.SalePrice` | Recorded sale price |
| `sales[].deedType` | string | OS Core | Forge | **GAP** | Warranty / Quit Claim / etc. |
| `sales[].exciseTaxNumber` | string | OS Core | Forge, Dossier | **GAP** | Recording reference |
| `sales[].validForRatio` | boolean | Forge | Forge, Summary | `ComparableSale.IsVerified` (approximate) | Arms-length transaction flag |
| `sales[].validationCode` | string | Forge | Forge | `ComparableSale.SaleQualification` | DOR sale validation code |
| `sales[].validationNotes` | string | Forge | Forge | **GAP** | Appraiser notes on sale validity |
| `sales[].grantor` | string | OS Core | Forge, Summary | `ClerkDocument.Grantor` (via parcel join) | Seller name — **PII** |
| `sales[].grantee` | string | OS Core | Forge, Summary | `ClerkDocument.Grantee` (via parcel join) | Buyer name — **PII** |
| `sales[].timeAdjustedPrice` | currency | Forge | Forge | **GAP** | Sale price adjusted to appraisal date |

---

## 6. Valuation State

### 6a. Cost Approach

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `costApproach.landValue` | currency | Forge | Summary, Forge | `ValuationRecord.LandValue` / `Property.LandValue` | Sum of land segment values |
| `costApproach.improvementValue` | currency | Forge | Summary, Forge | `Property.ImprovementValue` / `ValuationRecord.Rcnld` | Sum of all RCNLD values |
| `costApproach.totalValue` | currency | Forge | Summary, Forge | `ValuationRecord.CostApproachValue` | Land + Improvements |
| `costApproach.effectiveDate` | date | Forge | Forge | `Property.AssessmentDate` | Appraisal date |
| `costApproach.modelId` | string | Forge | Forge | **GAP** | Cost model version used |
| `costApproach.costTable` | string | Forge | Forge | `CostMatrix` (entity, not single field) | Marshall & Swift / local table reference |

### 6b. Sales Comparison Approach

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `salesApproach.indicatedValue` | currency | Forge | Summary, Forge | `ValuationRecord.SalesComparisonValue` | Sales comparison indicated value |
| `salesApproach.comparables[]` | CompSelection[] | Forge | Forge, Dossier | `ComparableSale` (filtered by selection) | Selected comparables |
| `salesApproach.comparables[].parcelId` | string | Forge | Forge | `ComparableSale.ParcelId` | Comp parcel ID |
| `salesApproach.comparables[].saleDate` | date | Forge | Forge | `ComparableSale.SaleDate` | Comp sale date |
| `salesApproach.comparables[].salePrice` | currency | Forge | Forge | `ComparableSale.SalePrice` | Comp sale price |
| `salesApproach.comparables[].adjustedPrice` | currency | Forge | Forge | **GAP** | After paired adjustments |
| `salesApproach.comparables[].adjustments[]` | Adjustment[] | Forge | Forge, Dossier | **GAP** | Individual adjustments (location, size, condition, etc.) |
| `salesApproach.comparables[].similarityScore` | decimal | Forge | Forge | **GAP** | AI-computed similarity metric |
| `salesApproach.selectionRationale` | string | Forge | Forge, Dossier | **GAP** | Why these comps were chosen |
| `salesApproach.reconciliationNotes` | string | Forge | Forge, Dossier | **GAP** | Appraiser notes on comp weighting |

### 6c. Income Approach

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `incomeApproach.potentialGrossIncome` | currency | Forge | Forge | `ValuationRecord.GrossIncome` | PGI |
| `incomeApproach.vacancyRate` | decimal | Forge | Forge | `ValuationRecord.VacancyRate` | Vacancy and collection loss % |
| `incomeApproach.effectiveGrossIncome` | currency | Forge | Forge | **GAP** | EGI = PGI x (1 - vacancy) |
| `incomeApproach.operatingExpenses` | currency | Forge | Forge | `ValuationRecord.OperatingExpenses` | Total operating expenses |
| `incomeApproach.netOperatingIncome` | currency | Forge | Forge, Summary | `ValuationRecord.NetOperatingIncome` | NOI = EGI - expenses |
| `incomeApproach.capRate` | decimal | Forge | Forge, Summary | `ValuationRecord.CapRate` | Capitalization rate |
| `incomeApproach.indicatedValue` | currency | Forge | Summary, Forge | `ValuationRecord.IncomeApproachValue` | NOI / cap rate |
| `incomeApproach.grmValue` | currency | Forge | Forge | **GAP** | Gross Rent Multiplier approach value |
| `incomeApproach.leases[]` | LeaseAbstract[] | Forge | Forge, Dossier | **GAP** | Individual lease records |
| `incomeApproach.expenseBreakdown` | ExpenseDetail | Forge | Forge | **GAP** | Categorized expenses |
| `incomeApproach.marketRentAnalysis` | MarketRentData | Forge | Forge | **GAP** | Market rent justification |
| `incomeApproach.capRateSupport` | string | Forge | Forge, Dossier | **GAP** | Cap rate derivation narrative |

### 6d. Reconciled Value

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `reconciledValue.assessedValue` | currency | Forge | All | `Property.AssessedValue` / `PropertyAssessment.TotalAssessedValue` (Data) | Final assessed value for tax year |
| `reconciledValue.marketValue` | currency | Forge | All | `Property.MarketValue` / `PropertyAssessment.MarketValue` (Data) | Appraiser's opinion of market value |
| `reconciledValue.taxableValue` | currency | Forge | Summary, Dais | `PropertyAssessment.TaxableValue` (Data) | After exemptions/programs |
| `reconciledValue.taxYear` | number | Forge | All | `Property.TaxYear` / `ValuationRecord.TaxYear` | Assessment year |
| `reconciledValue.costWeight` | decimal | Forge | Forge | **GAP** | Weight given to cost approach |
| `reconciledValue.salesWeight` | decimal | Forge | Forge | **GAP** | Weight given to sales approach |
| `reconciledValue.incomeWeight` | decimal | Forge | Forge | **GAP** | Weight given to income approach |
| `reconciledValue.reconciliationNarrative` | string | Forge | Forge, Dossier | `ValuationRecord.Notes` (partial) | Appraiser's value reconciliation explanation |
| `reconciledValue.appraiserSignoff` | string | Forge | All | `ValuationRecord.ReviewedBy` | Appraiser ID who signed the value |
| `reconciledValue.signoffDate` | date | Forge | All | `ValuationRecord.ReviewedAt` | Date of appraiser sign-off |
| `reconciledValue.modelVersion` | string | Forge | Forge | **GAP** | Mass appraisal model version (if model-derived) |

---

## 7. Exemptions & Programs

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `exemptions[]` | Exemption[] | Dais | Summary, Forge, Dais | **GAP** (partial: `PropertyAssessment.ExemptionTypes` / `ExemptionAmount` in Data entity) | Active exemptions |
| `exemptions[].type` | enum | Dais | All | **GAP** | Senior / Disabled / Agricultural / Forest / Historic / Nonprofit / etc. |
| `exemptions[].status` | enum | Dais | All | **GAP** | Active / Pending / Expired / Denied |
| `exemptions[].effectiveDate` | date | Dais | All | **GAP** | When exemption takes effect |
| `exemptions[].expirationDate` | date | Dais | All | **GAP** | Renewal deadline (null = permanent) |
| `exemptions[].valueReduction` | currency | Dais | Forge, Summary | `PropertyAssessment.ExemptionAmount` (Data, aggregate only) | Dollar amount of exemption |
| `exemptions[].percentReduction` | decimal | Dais | Forge, Summary | **GAP** | Percentage reduction |
| `exemptions[].applicationRef` | string | Dais | Dossier | **GAP** | Reference to application document |
| `exemptions[].lastReviewDate` | date | Dais | Dais | **GAP** | Most recent eligibility review |
| `currentUsePrograms[]` | CurrentUse[] | Dais | Summary, Forge, Dais | **GAP** | Current Use / Open Space programs |
| `currentUsePrograms[].programType` | enum | Dais | All | **GAP** | Timber / Agriculture / Open Space |
| `currentUsePrograms[].currentUseValue` | currency | Dais | Forge, Summary | **GAP** | Reduced value under program |
| `currentUsePrograms[].marketValue` | currency | Forge | Summary | **GAP** | Full market value (deferred tax basis) |
| `currentUsePrograms[].deferredTax` | currency | Dais | Summary | **GAP** | Accumulated deferred tax |

---

## 8. Permits & Changes

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `permits[]` | Permit[] | Dais | Summary, Forge, Dais | **GAP** (flag only: `PropertyAssessment.HasActivePermits` in Data entity) | Building permits affecting parcel |
| `permits[].permitNumber` | string | Dais | All | **GAP** | Jurisdiction permit number |
| `permits[].permitType` | enum | Dais | All | **GAP** | New Construction / Remodel / Demo / Mechanical / etc. |
| `permits[].status` | enum | Dais | All | **GAP** | Issued / In Progress / Final / Expired |
| `permits[].issuedDate` | date | Dais | All | **GAP** | Permit issuance date |
| `permits[].completionDate` | date | Dais | All | **GAP** | Estimated or actual completion |
| `permits[].estimatedCost` | currency | Dais | Forge | **GAP** | Permit-stated cost of work |
| `permits[].valuationImpact` | currency | Forge | Summary | **GAP** | Assessed value change from permit |
| `permits[].inspectionStatus` | string | Dais | Forge | **GAP** | Field inspection flag |
| `permits[].assignedAppraiser` | string | Dais | Forge | **GAP** | Appraiser assigned to review |

---

## 9. Workflow State

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `workflowState.status` | enum | Dais | All | `PropertyAssessment.AssessmentStatus` (Data, partial) / `ValuationRecord.Status` | Queued / In Progress / Under Review / Complete / On Hold |
| `workflowState.assignedTo` | string | Dais | All | **GAP** | Current appraiser assignment |
| `workflowState.priority` | enum | Dais | All | **GAP** | Normal / High / Urgent |
| `workflowState.dueDate` | date | Dais | All | **GAP** | SLA deadline |
| `workflowState.lastAction` | string | Dais | All | **GAP** | Most recent workflow action |
| `workflowState.lastActionDate` | date | Dais | All | **GAP** | Timestamp of last action |
| `workflowState.queue` | string | Dais | All | **GAP** | Current queue name |
| `workflowState.escalationLevel` | number | Dais | All | **GAP** | Escalation tier (0 = normal) |
| `workflowState.certificationStatus` | enum | Dais | Summary | **GAP** | Not Started / In Progress / Certified |

---

## 10. Notes & Evidence

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `notes[]` | AppraiserNote[] | Dossier | All | `DossierNote` | Appraiser notes and observations |
| `notes[].author` | string | Dossier | All | `DossierNote.CreatedBy` | Appraiser ID |
| `notes[].createdAt` | datetime | Dossier | All | `DossierNote.CreatedAt` | Note timestamp |
| `notes[].category` | enum | Dossier | All | `DossierNote.NoteType` | Field Inspection / Valuation / Taxpayer Contact / Internal |
| `notes[].content` | string | Dossier | All | `DossierNote.Content` | Note text |
| `notes[].attachments[]` | FileRef[] | Dossier | All | **GAP** (partial: `DossierDocument` linked via parcel) | Attached files |
| `evidencePackets[]` | EvidencePacket[] | Dossier | Forge, Dais, Dossier | `DossierPacket` | Pre-assembled defense packets |
| `evidencePackets[].packetType` | enum | Dossier | All | `DossierPacket.PacketType` | BOE Defense / Informal Review / Certification |
| `evidencePackets[].createdAt` | datetime | Dossier | All | `DossierPacket.CreatedAt` | Packet assembly date |
| `evidencePackets[].documents[]` | FileRef[] | Dossier | All | `DossierPacketItem` (links to `DossierDocument`) | Packet contents |
| `evidencePackets[].narrative` | string | Dossier | All | **GAP** | AI-generated or appraiser-written narrative summary |

---

## 11. Audit Trail

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `traceEvents[]` | TraceEvent[] | TerraTrace (OS) | All (filtered by classification) | `AuditLog` (partial mapping) | Append-only activity log |
| `traceEvents[].eventType` | enum | TerraTrace | All | `AuditLog.Type` | Per TerraTrace event model (tool_invoked, artifact_created, etc.) |
| `traceEvents[].correlationId` | string | TerraTrace | All | `AuditLog.CorrelationId` | Links invoke to result |
| `traceEvents[].timestamp` | datetime | TerraTrace | All | `AuditLog.Timestamp` | Event timestamp (UTC) |
| `traceEvents[].actor` | string | TerraTrace | All | `AuditLog.UserId` / `AuditLog.UserEmail` | User or agent ID |
| `traceEvents[].component` | string | TerraTrace | All | `AuditLog.Source` | Emitting component |
| `traceEvents[].classification` | enum | TerraTrace | Filtered | **GAP** | PUBLIC / CONFIDENTIAL / RESTRICTED |
| `traceEvents[].payload` | object | TerraTrace | Filtered | `AuditLog.Data` (JSON) | Event-specific data (PII-sanitized) |
| `traceEvents[].payloadRef` | URI | TerraTrace | Filtered | **GAP** | Large payload stored by reference |

---

## 12. Appeal History

| Field | Type | Write Owner | Readers | Backend Entity | Notes |
|-------|------|-------------|---------|----------------|-------|
| `appeals[]` | Appeal[] | Dais | All | **GAP** (flag only: `PropertyAssessment.HasAppeals` in Data entity) | BOE and informal review records |
| `appeals[].appealId` | string | Dais | All | **GAP** | Unique appeal identifier |
| `appeals[].type` | enum | Dais | All | **GAP** | Informal Review / BOE / Superior Court |
| `appeals[].taxYear` | number | Dais | All | **GAP** | Tax year under appeal |
| `appeals[].filedDate` | date | Dais | All | **GAP** | Date appeal was filed |
| `appeals[].hearingDate` | date | Dais | All | **GAP** | Scheduled hearing date |
| `appeals[].status` | enum | Dais | All | **GAP** | Filed / Scheduled / Heard / Decided / Withdrawn |
| `appeals[].petitionerValue` | currency | Dais | Forge | **GAP** | Value claimed by petitioner |
| `appeals[].assessorValue` | currency | Dais | Forge | **GAP** | Assessor's original value |
| `appeals[].determinedValue` | currency | Dais | Forge, Summary | **GAP** | BOE-determined value |
| `appeals[].outcome` | enum | Dais | All | **GAP** | Upheld / Reduced / Increased / Remanded / Withdrawn |
| `appeals[].defensePacketRef` | string | Dais | Dossier | **GAP** | Reference to evidence packet used |
| `appeals[].boardNotes` | string | Dais | All | **GAP** | BOE decision summary |

---

## 13. Gap Analysis

This section enumerates every schema field that has no direct backend entity or requires a new entity/property to implement. Gaps are grouped by severity relative to the phased rollout.

### Critical (blocks Phase 1 — Summary + Forge tabs)

These gaps prevent the core valuation workflow from functioning.

1. **`landSegments[]` (Section 3)** — No `LandSegment` entity exists. Forge needs per-segment land values for the cost approach. Requires: new `LandSegment` entity with `ParcelId`, `UseCode`, `Acres`, `RatePerAcre`, `AdjustedValue`, and a child `LandAdjustment` entity.

2. **`buildings[].livingSqFt` (Section 4a)** — `CamaCharacteristic` has `SquareFeet` (gross) but no above-grade living area field. `ComparableSale.GrossLivingArea` exists only for comps. Requires: add `LivingSqFt` property to `CamaCharacteristic`.

3. **`buildings[].basementFinishedSqFt` (Section 4a)** — `CamaCharacteristic.BasementSqft` stores total basement area, not finished area. Requires: add `BasementFinishedSqft` to `CamaCharacteristic`.

4. **`buildings[].garageType` (Section 4a)** — No garage type field on `CamaCharacteristic`. Requires: add `GarageType` string property.

5. **`buildings[].basement` (Section 4a)** — No basement type enum on `CamaCharacteristic`. Requires: add `BasementType` string property (Full / Partial / Crawl / None).

6. **`buildings[].yearRemodeled` (Section 4a)** — Not tracked in `CamaCharacteristic`. Requires: add `YearRemodeled` int? property.

7. **`salesApproach.comparables[].adjustedPrice` (Section 6b)** — No per-comp adjusted price stored. Requires: new `CompSelection` join entity or `AdjustedPrice` field linking subject parcel to selected `ComparableSale` records.

8. **`salesApproach.comparables[].adjustments[]` (Section 6b)** — No paired-sales adjustment entity exists. Requires: new `CompAdjustment` entity with adjustment type, amount, and direction.

9. **`salesApproach.comparables[].similarityScore` (Section 6b)** — Not persisted. Requires: field on the comp-selection join entity.

10. **`salesApproach.selectionRationale` / `reconciliationNotes` (Section 6b)** — No narrative fields on `ValuationRecord` for sales approach. Requires: add to `ValuationRecord` or new entity.

11. **`reconciledValue.costWeight` / `salesWeight` / `incomeWeight` (Section 6d)** — Reconciliation weights not stored. Requires: three decimal fields on `ValuationRecord`.

12. **`costApproach.modelId` / `reconciledValue.modelVersion` (Sections 6a, 6d)** — No model-version tracking. Requires: `ModelId` / `ModelVersion` fields on `ValuationRecord`.

### Important (blocks Phase 2-3 — Dais, Atlas, Dossier tabs)

13. **`owners[]` as array (Section 2)** — `Property.OwnerName` is a single string. Multi-owner support requires a new `ParcelOwner` entity with `Name`, `OwnershipType`, `PercentOwned`, `MailingAddress`, `AcquiredDate`, `DeedReference`.

14. **`exemptions[]` (Section 7, all fields)** — Only aggregate `ExemptionAmount` and JSON `ExemptionTypes` exist on `PropertyAssessment` (Data). Requires: new `Exemption` entity with all nine fields.

15. **`currentUsePrograms[]` (Section 7)** — No entity exists. Requires: new `CurrentUseProgram` entity with `ProgramType`, `CurrentUseValue`, `MarketValue`, `DeferredTax`.

16. **`permits[]` (Section 8, all fields)** — Only a boolean `HasActivePermits` flag exists. Requires: new `Permit` entity with all ten fields.

17. **`appeals[]` (Section 12, all fields)** — Only a boolean `HasAppeals` flag exists. Requires: new `Appeal` entity with all thirteen fields.

18. **`workflowState` (Section 9, most fields)** — `PropertyAssessment.AssessmentStatus` and `ValuationRecord.Status` provide partial coverage. Missing: `assignedTo`, `priority`, `dueDate`, `lastAction`, `lastActionDate`, `queue`, `escalationLevel`, `certificationStatus`. Requires: new `ParcelWorkflowState` entity or extend `ValuationRecord`.

19. **`floodZone` / `soilType` (Section 3)** — Atlas spatial data not in any entity. Requires: new `ParcelSpatialAttributes` entity or add fields to `CamaCharacteristic`.

20. **`frontage` / `waterfront` (Section 3)** — Not tracked. Requires: add to `CamaCharacteristic` or a new land-attributes entity.

21. **`traceEvents[].classification` / `payloadRef` (Section 11)** — `AuditLog` has no classification enum or external payload reference. Requires: add `Classification` and `PayloadRef` to `AuditLog`.

22. **`notes[].attachments[]` (Section 10)** — `DossierNote` has no direct attachment link. Requires: a `DossierNoteAttachment` join entity to `DossierDocument`, or an `AttachmentIds` JSON column.

23. **`evidencePackets[].narrative` (Section 10)** — `DossierPacket` has no narrative field. Requires: add `Narrative` string property to `DossierPacket`.

### Future (Phase 4+)

24. **`outbuildings[]` (Section 4b, all fields)** — No distinct outbuilding entity. Requires: new `Outbuilding` entity separate from `CamaCharacteristic`.

25. **`sketches[]` / `photos[]` typed collections (Section 4c)** — Currently modeled generically via `DossierDocument`. Requires: either sub-type fields on `DossierDocument` (e.g., `BuildingId`, `PhotoType`) or dedicated `Sketch` / `Photo` entities.

26. **`sales[].deedType` / `exciseTaxNumber` / `timeAdjustedPrice` / `validationNotes` (Section 5)** — `ComparableSale` lacks these recording-oriented fields. Requires: add to `ComparableSale` or a new `SaleRecord` entity that wraps clerk data.

27. **`incomeApproach.grmValue` / `leases[]` / `expenseBreakdown` / `marketRentAnalysis` / `capRateSupport` (Section 6c)** — `ValuationRecord` stores top-line income numbers but not the supporting detail. Requires: new `LeaseAbstract`, `ExpenseDetail`, `MarketRentAnalysis` entities, plus `GrmValue` and `CapRateSupport` fields.

28. **`incomeApproach.effectiveGrossIncome` (Section 6c)** — Derivable from `GrossIncome * (1 - VacancyRate)` but not persisted. Requires: add `EffectiveGrossIncome` to `ValuationRecord` or compute at query time.

---

## 14. Type Mismatch Analysis

This section identifies cases where the schema document expects a different data type than the backend currently provides.

| Schema Field | Schema Type | Backend Entity.Property | Backend Type | Mismatch | Resolution |
|---|---|---|---|---|---|
| `buildings[].bathrooms` | `decimal` (supports half-baths: 2.5) | `CamaCharacteristic.Bathrooms` | `int?` | **Type mismatch**: int cannot represent half-baths | Change `CamaCharacteristic.Bathrooms` to `decimal?` |
| `buildings[].bathrooms` | `decimal` | `ComparableSale.Bathrooms` | `int?` | **Type mismatch**: same half-bath issue on comp records | Change `ComparableSale.Bathrooms` to `decimal?` |
| `buildings[].bathrooms` | `decimal` | `PropertyAssessment.Bathrooms` (Data) | `decimal?` | **OK** | Data entity already uses `decimal(3,1)` |
| `buildings[].grossSqFt` | `number` (integer implied) | `CamaCharacteristic.SquareFeet` | `decimal` | **Minor**: schema implies integer, backend is decimal | Acceptable — decimal is more precise. Update schema to `decimal` or truncate on read. |
| `buildings[].garageSqFt` | `number` (integer implied) | `CamaCharacteristic.GarageSqft` | `decimal?` | **Minor**: same as above | Same resolution. |
| `buildings[].basementFinishedSqFt` | `number` (integer implied) | `CamaCharacteristic.BasementSqft` | `decimal?` | **Minor**: type OK, but semantics differ (total vs. finished) | Semantic gap — see Section 13 item 3. |
| `buildings[].physicalDepreciation` | `decimal` (0.0-1.0 percent) | `ValuationRecord.DepreciationPercent` | `decimal?` | **OK** but naming differs | Verify both use the same scale (percentage vs. fraction). |
| `buildings[].economicObsolescence` | `decimal` | `CamaCharacteristic.ExternalObsolescence` | `decimal?` | **Naming mismatch** only — types match | Align naming: schema says "economic", backend says "external". Both are standard IAAO terms for the same concept. |
| `countyId` | `GUID` | `Property.CountyId` | `Guid` | **OK** | Exact match. |
| `totalSqFt` | `number` | `CamaCharacteristic.LandAreaSqft` | `decimal?` | **Minor**: schema implies integer, backend is nullable decimal | Acceptable. |
| `reconciledValue.assessedValue` | `currency` | `Property.AssessedValue` | `decimal` | **OK** | Direct match. |
| `sales[].validForRatio` | `boolean` | `ComparableSale.IsVerified` | `bool` | **Semantic gap**: "valid for ratio" (arms-length) is not the same as "is verified" | Consider adding a dedicated `ValidForRatio` bool to `ComparableSale`. |
| `sales[].validationCode` | `string` | `ComparableSale.SaleQualification` | `string` | **Semantic overlap**: qualification (qualified/non-arms-length/foreclosure/estate) vs DOR validation code | May need both fields — `SaleQualification` is broader than a DOR code. |

---

## Write Lane Summary

| Write Owner | Sections Owned |
|-------------|----------------|
| **OS Core** | 1 (Identity), 2 (Ownership), parts of 3 (Land base), 5 (Sales — recording data) |
| **Forge** | 3 (Land segments/adjustments), 4 (Improvements), 5 (Sale validation), 6 (All valuation) |
| **Atlas** | 3 (floodZone, soilType), 1 (neighborhood — shared with OS Core) |
| **Dais** | 7 (Exemptions), 8 (Permits), 9 (Workflow), 12 (Appeals) |
| **Dossier** | 10 (Notes & Evidence) |
| **TerraTrace** | 11 (Audit Trail) — append-only, never editable |

---

## Tab to Schema Mapping

| Workbench Tab | Primary Schema Sections | Access Pattern |
|---------------|------------------------|----------------|
| **Summary** | 1, 2, 3 (summary), 4 (summary), 5 (recent), 6d (reconciled value), 7 (active), 9 (status) | Read-only aggregation |
| **Forge** | 3, 4, 5, 6 (all sub-sections) | Read + Write (valuation artifacts) |
| **Atlas** | 1 (location), 3 (spatial fields), geometric boundaries | Read + Write (GIS artifacts) |
| **Dais** | 7, 8, 9, 12 | Read + Write (workflow/admin state) |
| **Dossier** | 10, evidence from 6 (defense narratives) | Read + Write (notes/evidence) |
| **Pilot** | 11 (trace events), tool invocation results | Read (trace) + Execute (tools) |
| **Clerk** | 2 (ownership), 5 (deed references) | Read (future office — transitional slot) |
| **Treasury** | 6d (taxable value), 7 (exemption impacts) | Read (future office — transitional slot) |
| **Audit** | 11 (trace events), 6d (value history) | Read (future office — transitional slot) |

---

## PII Fields (TerraTrace Exclusion List)

The following fields MUST NEVER appear in TerraTrace event payloads. Redaction is enforced at the trace emission layer.

- `owners[].name`
- `owners[].mailingAddress`
- `sales[].grantor`
- `sales[].grantee`
- Any SSN, phone number, or email address (not modeled — excluded by policy)

---

## Open Questions (Future ADRs)

1. **BPP (Business Personal Property)**: Separate schema or parcel extension? Current schema is real property only.
2. **Manufactured Homes**: Separate parcel type or building sub-type?
3. **Condominiums**: Unit-level schema within parcel?
4. **Agricultural Land Programs**: Separate current-use valuation model within `costApproach`?
5. **Historical Value Archive**: How many years of `reconciledValue` history to keep inline vs. archive?
