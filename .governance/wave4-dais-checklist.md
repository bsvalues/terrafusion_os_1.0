# Wave 4: Dais Persistence Checklist

## Entities (read from existing untracked files)
- [ ] Appeal — Id (Guid), ParcelId, AppealGround (MARKET_VALUE|UNIFORMITY|CLASSIFICATION|EXEMPTION_DENIAL|CLERICAL_ERROR), Status (filed|scheduled|heard|decided|withdrawn), PetitionerName, FiledDate, HearingDate, DecisionDate, CurrentValue, RequestedValue, DecidedValue, DecisionNotes, TaxYear, CountyId, County (nav), CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
- [ ] CertificationStep — Id (Guid), TaxYear, StepCode (PRELIMINARY_ROLL|FINAL_VALUES|TAX_ROLL_CERTIFICATION|etc.), Status (pending|in_progress|completed|blocked), CompletedBy, CompletedAt, Notes, DependsOnStepId (nullable FK to prior step), CountyId, County (nav), CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
- [ ] Exemption — Id (Guid), ParcelId, ProgramCode (SENIOR_DISABLED|CURRENT_USE|HISTORIC|etc.), Status (pending|approved|denied|expired), ApplicantName, ApplicationDate, EffectiveDate, ExpirationDate, ExemptionAmount, RcwReference, DenialReason, Notes, CountyId, County (nav), CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
- [ ] Notice — Id (Guid), ParcelId, TemplateId, DeliveryMethod (mail|email|certified_mail), Status (generated|queued|sent|failed|sealed), SentAt, Fields (JSON), RcwReference, FailureReason, CountyId, County (nav), CreatedBy, UpdatedBy, CreatedAt, UpdatedAt
- [ ] QueueItem — Id (Guid), ParcelId, TaskType (FIELD_INSPECTION|DESK_REVIEW|APPEAL_PREPARATION|etc.), Priority (normal|high|urgent), Status (queued|in_progress|completed|failed|escalated), AssignedTo, SlaHours, SlaDeadline, StartedAt, CompletedAt, Notes, CountyId, County (nav), CreatedBy, UpdatedBy, CreatedAt, UpdatedAt

## Service Interfaces (canonical definitions in *Service.cs files)
- [ ] IAppealService — CreateAsync, GetByIdAsync(id, countyId), GetByParcelAsync(parcelId, countyId), UpdateStatusAsync(id, status, countyId, decisionNotes?, decidedValue?), GetByTaxYearAsync(taxYear, countyId)
- [ ] ICertificationService — CreateAsync, GetByIdAsync(id, countyId), GetByTaxYearAsync(taxYear, countyId), CompleteStepAsync(id, completedBy, countyId)
- [ ] IExemptionService — CreateAsync, GetByIdAsync(id, countyId), GetByParcelAsync(parcelId, countyId), UpdateStatusAsync(id, status, countyId)
- [ ] INoticeService — CreateAsync, GetByIdAsync(id, countyId), GetByParcelAsync(parcelId, countyId), UpdateStatusAsync(id, status, countyId)

## DbContext Registration
- [ ] DbSet<Appeal>
- [ ] DbSet<CertificationStep>
- [ ] DbSet<Exemption>
- [ ] DbSet<Notice>
- [ ] DbSet<QueueItem> (verify — may already exist)

## Service Implementation
- [ ] AppealService : IAppealService (exists in Core/Services/AppealService.cs)
- [ ] CertificationService : ICertificationService (exists in Core/Services/CertificationService.cs)
- [ ] ExemptionService : IExemptionService (exists in Core/Services/ExemptionService.cs)
- [ ] NoticeService : INoticeService (exists in Core/Services/NoticeService.cs)

## Controller Delegation
- [ ] DaisController.cs — thin delegation to services

## County Isolation Rules
- Every GetAll/GetById must filter by CountyId
- No cross-county reads without explicit approval

## Lane Guards
- Dais writes workflow/admin state ONLY
- No Forge valuation writes from Dais services
- No Dossier evidence/document writes from Dais services
