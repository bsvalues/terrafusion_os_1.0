# EO-TF-FORGE-COST-INCOME-001: approved additive exchange specification

Authority: owner's EO, contract-authority.md and coordinator reservations.md (2026-09-07). Semantic owner Forge; sovereign OS owns this exchange authority and host context. Mechanical OS alias WO-EO-TF-FORGE-COST-INCOME-001. This specification is proposed/approved implementation authority, not protected source or publication evidence. Frozen forge.valuation@1.0.0 and crosscut.audit@1.0.0 remain unchanged.

## Wire contract

Existing stdin/stdout invocation envelope: contractPackVersion, moduleApiVersion, requestId (strings), action (string), payload (object). For new actions both envelope versions must equal "1.0.0". Actions `cost` and `income` consume forge.cost@1.0.0 and forge.income@1.0.0 respectively. `valuate` remains compatible.

Both payloads require schemaVersion:"1.0.0" and nonblank parcelId (string). Numeric fields are JSON numbers represented with checked base-10 decimal arithmetic; strings, booleans, null, missing fields, nonfinite/unrepresentable values fail closed. No coercion or implicit input defaults. Additional fields are rejected in new payloads and expenses objects to expose version mismatch. All arithmetic intermediates must be representable. Midpoint ties round to even at exactly two decimal places. OS supplies resolved reference values; kernel contains no county lookup, mutable policy tables, local clock use in math, or I/O in calculation functions.

Success envelope: {success:true,data:{...},auditEvent:{existing audit fields}}. New data has schemaVersion:"1.0.0", parcelId and named numeric results below. Trace metadata is separate from deterministic data; real wrapper may assign event ID/time and truthful compiled source identity. Failure envelope: {success:false,error:string,validation:{code,field,message}}, with no data or auditEvent. Codes: MISSING_FIELD, INVALID_INPUT, UNSUPPORTED_VERSION, NUMERIC_OVERFLOW. `field` is payload field name (nested expenses use expenses.name); envelope version errors name the envelope field; overflow uses calculation. Malformed invocation and unknown-action failclosed behavior remain compatible with legacy error strings. No new error changes the old valuate contract.

## forge.cost@1.0.0

Required payload numbers: squareFeet>0; baseCostPerSqft>0; revalAreaFactor>=0; qualityFactor>=0; complexityFactor>=0; depreciationFactor in [0,1] (retained fraction); conditionFactor>=0; landValue>=0.

Preserved CostForgeController.ComputeCostEstimate/TryBuildRequestDrivenCostAnalysis production sequence:

1. rcnPerSqft = round(baseCostPerSqft * revalAreaFactor * qualityFactor * complexityFactor).
2. rcndPerSqft = round(rcnPerSqft * depreciationFactor).
3. adjustedCostPerSqft = round(rcndPerSqft * conditionFactor).
4. replacementCost = round(rcnPerSqft * squareFeet).
5. rcnd = round(rcndPerSqft * squareFeet).
6. rcnld = round(adjustedCostPerSqft * squareFeet).
7. physicalDepreciation = replacementCost - rcnd; conditionAdjustment = rcnld - rcnd; totalValue = round(rcnld + landValue).

Data fields exactly schemaVersion, parcelId, rcnPerSqft, rcndPerSqft, adjustedCostPerSqft, replacementCost, physicalDepreciation, conditionAdjustment, rcnld, landValue, totalValue. Assessment multiplier stays existing 1.00; no new methodology. OS resolves age/reference factors explicitly and retains reference provenance.

## forge.income@1.0.0

Required numbers: annualRentalIncome>0; vacancyRate in [0,100] percentage points; otherIncome>=0; capRate in (0,25] percentage points; locationMultiplier>0. Required expenses object has exactly propertyTaxes, insurance, utilities, maintenance, managementFees, replacementReserves, otherExpenses, all numeric >=0.

Preserved production sequence:

1. vacancyLoss = round(annualRentalIncome * vacancyRate / 100) (explanatory output).
2. effectiveGrossIncome = round(annualRentalIncome * (1 - vacancyRate/100) + otherIncome).
3. totalExpenses = round(sum of the seven named expenses in listed order).
4. netOperatingIncome = round(effectiveGrossIncome - totalExpenses); expenseRatio = EGI>0 ? round(totalExpenses/EGI*100) : 0 (percentage points, preserving existing calculate-noi production behavior).
5. rawValuation = NOI>0 ? round(NOI/(capRate/100)) : 0.
6. adjustedValuation = round(rawValuation * locationMultiplier).
7. grossIncomeMultiplier = EGI>0 ? round(adjustedValuation/EGI) : 0.
8. unroundedCashOnCash = rawValuation>0 ? NOI/rawValuation*100 : 0. Convert this decimal to double for the existing production boundary. cashOnCashReturn = round(the .NET-compatible conversion of that double back to decimal: 15 significant digits with midpoint-to-even integer conversion and maximum decimal scale 28, matching .NET 8 Decimal.DecCalc.VarDecFromR8). Do not directly round the pre-conversion decimal or use rust_decimal's higher-precision default float conversion. Example: NOI61250000000000.01 / raw1000000000000000.16 *100 gives decimal6.1250000000000000200, double6.125, display6.12.
9. riskClassification = capRate>7 and unroundedCashOnCash>8 ? "low" : capRate<4 or unroundedCashOnCash<3 ? "high" : "medium". Comparison preserves current production double conversion boundaries where applicable.

Data fields exactly schemaVersion, parcelId, annualRentalIncome, vacancyLoss, otherIncome, effectiveGrossIncome, totalExpenses, expenseRatio, netOperatingIncome, capRate, locationMultiplier, rawValuation, adjustedValuation, grossIncomeMultiplier, cashOnCashReturn, riskClassification. Nonpositive NOI remains visible and produces zero indicated value. Reference location/property labels/date/source are OS projection metadata, not invented kernel provenance. No comparable analysis, cap-rate extraction, Sales or Reconciliation. Coordinator explicitly released the initial suite freeze only for this additive expenseRatio output and its rounding/zero-EGI tests; no frozen legacy contract or publication change.

## Proof / adoption

Real executable RED/GREEN tests with literal independently checked expected outputs; missing/invalid, midpoint ties, zero/full depreciation, zero adjustments, vacancy0/100, expense/no-positive-NOI, cap boundaries, overflow, repeatability, unknown action and valuate regression. Suite protected before exact OS adoption. Legacy source hash must never label new source. Linux WO-SR-007 publication/workflow remains held. OS process/staging/registration remains coordinator serialized. Browser against actual candidate and repeated after protected OS merge remains necessary for completion.

## Exact reserved suite path inventory

- kernels/terraforge.kernel.valuation/src/main.rs
- kernels/terraforge.kernel.valuation/src/approaches.rs
- kernels/terraforge.kernel.valuation/tests/approaches.rs
- kernels/terraforge.kernel.valuation/Cargo.toml
- kernels/terraforge.kernel.valuation/Cargo.lock
- kernels/terraforge.kernel.valuation/build.rs (truthful full current identity/build invalidation only)
- canon/CONTRACT_DEPENDENCY.md (additive declaration only)
- .gitattributes (exact LF entries only)
- operations/work-orders/EO-TF-FORGE-COST-INCOME-001.md (this reproducible specification)
- operations/evidence/EO-TF-FORGE-COST-INCOME-001.md

Initial conditional proposal .github/workflows/suite-ci.yml remains HELD and unchanged. New Rust tests execute under existing cargo test checks. No frozen contract corpus or publication-lineage changes authorized. New source inventory for exact adoption consists of Cargo.toml, Cargo.lock, build.rs, src/main.rs, src/approaches.rs and this complete specification. Cargo.lock binds registry checksums of transitive packages; the adopter must verify all source inventory entries plus executable digest against the actual protected suite commit. Test source is retained as independent assurance evidence. Do not embed a predicted protected commit or the hash of this file inside itself.

<!-- END CANONICAL SPECIFICATION: the bytes above, through its original final newline, match the protected suite EO exactly. -->

## OS adoption evidence — separate from canonical specification bytes

The canonical specification above is the unchanged protected suite file at `operations/work-orders/EO-TF-FORGE-COST-INCOME-001.md`, SHA256 `8607b1d52c01ced00b0aec104db26b7f4de9a24dec529e948eaee5588a2baaa2`. This appendix does not amend its exchange semantics or frozen versions. Its initial workflow hold was prospectively superseded by the owner's exact authorization recorded in suite EO evidence: update the existing private producer for this new source only, preserve old immutable lineage, publish after protected merge. Coordinator confirms independent full25c4728 review PASS and protected PR8 merge `5216af45155954ac27a1acbf04b22085019380c1`, equal reviewed tree `00820b340e28ebb610942145dbe74c18051df31c`.

### Independently admitted native Windows artifact

Successful main push `.github/workflows/suite-ci.yml`, run `34177762622`, attempt `1`, repository `bsvalues/terrafusion-forge`, producer/source `5216af45155954ac27a1acbf04b22085019380c1`; all five jobs succeeded. Existing private Windows Actions artifact ID `10037872870`, name `terraforge-valuation-kernel-windows-x64-5216af45155954ac27a1acbf04b22085019380c1`, target `x86_64-pc-windows-msvc`.

- Downloaded ZIP SHA256 `986eb5b52791b79273ee485c034a99c859e33a2649fb7979cca5f1d2c05efdce`, independently compared with GitHub artifact digest.
- `manifest.json`,21747 bytes, SHA256 `9ab975d946f03862159fff95a57e68d3c0fde5767a9af5003b1a549d002c82f7`.
- `terraforge-kernel-valuation.exe`,467456 bytes, SHA256 `dc8a53d2f85a34ae0ddec38e173f83d8c68bd41ba3cea90aba6275363e0ef1be`.
- Exact native admission receipt,751 bytes, SHA256 `440715247fb5cd083a55460e68fc652cc756c3517ef363c3c1b1bc151a0d159d`. Closed receipt fields: schemaVersion1; transport `github-actions-windows-artifact@1`; repository; workflowPath; event `push`; branch `main`; conclusion `success`; runId/runAttempt/artifactId as strings; artifactName; protectedCommit; archiveSha256; manifestSha256; executableSha256.
- Complete seven-file source/spec closure SHA256 `e5e744804146c838e1ba1a302bb254ed4747be3c7404555367754b612ec16846`; UTF8 ordinal-sorted `path:sha256` newline records with final newline.
- Complete76 locked registry dependencies SHA256 `0ad27c47deecea65f88df4b74cba490a0fa69794e33803c40475f3da2e639776`; UTF8 ordinal-sorted `name@version|source|checksum` newline records with final newline. Both source hash maps and every dependency were independently checked against protected source by coordinator; builder additionally verified actual downloaded bytes and closure using the new stager validators read-only.

Receipt and ZIP are coordinator-owned evidence outside source, under `C:/Users/bsval/tf-suite-eo-001/producer-evidence/forge-34177762622/` (`windows-admission-receipt.json`, `windows.zip`); never mutate them. OS immutable admission constants bind these exact identities, not mutable caller configuration. Explicit CostIncome stager mode accepts only the existing downloaded artifact, with bounded two-file extraction, isolated slot, receipt verification and previous-triple rollback. No source build fallback. Default historical valuation stager/consumer remain unchanged. Paths stay opt-in; source identity admission is not runtime enablement, protected OS delivery, native execution or browser acceptance.

### Separate Linux private publication receipt

Same protected producer run successfully published and round-trip verified immutable OCI digest `sha256:7aee7aaa559583e9be382aac7c95ba7bbb670ed582d10c472a08d83a5eb21012` on the existing private `ghcr.io/bsvalues/terrafusion-forge-valuation-kernel` route, tag `5216af45155954ac27a1acbf04b22085019380c1-34177762622-1`. Producer evidence ZIP `linux-producer-evidence.zip` SHA256 `009814200227219666972d797d80325573ae80e9ef1d274d588fd94ffb541649`; manifest SHA256 `c255e3f855fb55ec8f98abe1e879ec70e980f1898b86e73a35c02ee9e1fb35c2`; Linux ELF executable SHA256 `42d9996129a90d11908a40beb9fe701b95057aeba8580a3459097a14c7801dc0`.

Evidence is producer-only: platform attestation unavailable. Coordinator local package metadata read returned403 lacking `read:packages`; no local GHCR pull/access/private visibility verification is claimed and no credential changes are authorized. Windows Actions intake is its independently approved native artifact path, not a Linux package-access workaround. Old Linux digest/source24059c and production release embedding paths remain immutable. No Linux deployment claim. Candidate native process/UI verification and post-merge browser journeys remain REQUIRED / NOT COMPLETE.

### Actual native candidate verification — 2026-09-08 (not protected OS completion)

Candidate execution is now demonstrated separately from the producer-only evidence above. The API, fixture assembly and complete native UI were built at OS product commit `9a723b069f84e76e3a2bfe78730231d6cabf4cab`. The actual browser harness commit is `31c2e92136ee5aacbfbc44a4299feb7925e7f368`, parent `1b21c638bcf2dea4b6005200ec4c173e7bdee5f1`. Its normal encoding/Prettier checkpoint changed only two existing reload helper calls; independent committed specification/quality review passed and raw/Git spec SHA256 is `d77a0d002d607175897002f5724019482fb99b9f84d98d21a24cfa8ab42ecd36`. No product rebuild or new native executable was substituted for that harness-only change. This documentation appendix is later, uncommitted evidence until its own normal checkpoint; it is not the tested harness or product build revision.

Prior bounded validation: actual API build passed; canonical Unit.Tests 48/48 and fresh real fixture 1/1 passed; normal frontend build passed. Separate explicit `noCheck=false` semantic diagnostic exited2 with1586 errors, NOT semantic PASS. Independent attribution corroborated the owned IncomeForge line111 expression/type issue as unchanged from protected073; the other1585 diagnostics were not broadly repaired or all proven baseline-equivalent. No full-solution/full-suite GREEN claim.

Actual run58513 began08:21:40.255Z on exclusively owned loopback5198 at10.101GiB free, with one worker, zero retries, one API and Chromium, no compiler/build/model. It naturally exited0 at08:22:56.746Z: **10 pure tests and all4 real browser journeys PASS**. The separate postcommit pure run also passed10/10. The real journeys exercised:

- Cost canonical equality against the actual protected native executable; invalid area with concrete CID/no stale result; parcel clearing and actual reload/reopening through the existing /forge application card.
- Income canonical equality, invalid cap-rate fail-closed behavior and actual reload/reopening. Visible synthetic NOI90,000, capitalization1,500,000 and location-adjusted1,725,000 were inspected with actual protected source/executable identity and CID.
- Real in-flight responses cannot restore results after parcel or county context changes.
- Actual API stop/start with a missing configured runtime makes both actions return503/no result; restart with the exact original artifact succeeds. Anonymous and foreign-parcel requests are rejected, and the final real EF fixture verifies no calculation saved values.

Runtime assertions compared actual response header CID, UI trace, canonical request/provenance, audit lineage and metric outcome. Durable evidence includes the runner log, eleven actual screenshots, fresh/no-values-saved fixture TRX (each1/1), preserved synthetic SQLite database and the scoped before/after inventories below. Independent retained-evidence audit is completed with qualifications: all eleven PNG hashes and both1/1TRX were verified; retained SQLite has unchanged three synthetic property values and actual Cost6/Income7 CID metric rows. **Evidence limitation:** per-request metric/provenance attachments were body-only under the list reporter and were not durably retained. Their assertions passed, but no complete raw-request/metric/provenance JSON or saved numeric per-request latency receipt is claimed. Completed qualified evidence audit is not unqualified visual acceptance.

All302 UI files,709 API DLL/PDB/deps/runtimeconfig files, five fixture/native identities,22 Forge Git source bindings and the actual bundled Node passed exact file-set/size/hash guards within those categories before08:21:20.141Z and after08:23:41.718Z. The709-file API inventory is explicitly filtered, NOT all configuration or native output:13 other output JSON files are outside it. No retrospective full-config/native-output custody is claimed. Stager Git LF and raw worktree CRLF identities are distinct, not interchangeable hashes. The protected5216 source, dc8a executable,9ab9 manifest and4407 admission receipt above remain unchanged, including after the missing-runtime/recovery journey.

Evidence root: `C:/Users/bsval/tf-suite-eo-001/os-forge/.tmp/forge-cost-income-browser/run-198cadf009b34396ac9db4328b617cf6/`.

- `browser-31c2e921-962666cc76d24305b0ff10836a4a50fa.log`: actual runner output and natural exit.
- `candidate-31c2e921-before-browser.json`: SHA256 `3622458e54c231f86fc0e5f25c75b38979f8f8bd4ae961f8b258b7fa5b2e7cbd`.
- `candidate-31c2e921-after-browser.json`: SHA256 `7e15ea8eec342dad39b1bef9e23ed595363031305d7e880e415f4dcd22d6dfa1`.
- `acceptance-31c2e921-execution-receipt.json`: exact execution counts, cleanup, memory samples and eleven screenshot paths/hashes.
- Screenshots: `output/playwright/forge-cost-income/run-2efa1787a1f94b95a2a222faf17098fe/`; fixture TRX/database: `.tmp/forge-cost-income-browser/run-2efa1787a1f94b95a2a222faf17098fe/`.

Own runner29668/worker28704 and all owned runtime processes were gone,5198 was free and Git clean at08:23:15.955Z (9.998GiB), before after-audit work. The compiler resource was immediately released to the coordinator; foreign5199 was untouched. All historical failed runs/screenshots/receipts remain preserved, not relabeled as success.

### Intermediate visual P2 and test-first correction — rebuilt paint pending

Independent reviewer and coordinator inspected the actual58513 Income200/503 PNGs and confirmed a visual P2: underlying ForgeSuiteHome text/cards visibly bleed through the Income form, result and error area. Cost is opaque. Historical10pure+4real functional PASS remains true, but owner-visible acceptance is withheld. The retained9a UI build does not contain the later correction below.

Source/build investigation found IncomeForge.tsx738 already had bg-background, while all13 retained generated CSS files contained ZERO .bg-background selectors. Compiled index-DxKNjSzf.css SHA256 `9b5bc8aeb90370c6349b031238a74f7bf0a6faa53cda89b0a6f8c77f58cfdf7b` retains the --background aliases and --tf-bg definitions. Working Cost .cf-workspace explicitly paints hsl(var(--tf-bg)); absent Income paint exposes the existing translucent window content/glass. No shared Tailwind/theme/router or layout change is included.

Test-first correction used the real Income component. After a separately recorded launcher-path setup failure (NOT RED), the canonical regression naturally failed at08:48:50.391Z because the rendered root backgroundColor was empty instead of hsl(var(--tf-bg));1failed/33filtered, existing Vitest config retry2 and one worker. Only then added the exact existing Income root inline style backgroundColor:'hsl(var(--tf-bg))', one insertion/one deletion. No padding/font/other-panel change. The SSR check proves that component's explicit paint boundary, NOT actual browser-computed opacity.

Five relevant focused files then passed72/72 at08:49:30.779Z: Income34 canonical+7 component; Cost23 canonical+7 deeplink+1 contracts. Ten pure browser-harness tests passed at08:49:46.657Z without API/browser. Existing React act/deferred-act and stale Browserslist warnings remain disclosed. Actual computed browser assertions now require opaque rgb/rgba alpha1 and opacity1 for Income200/422/503 and retain bounded, raw-redacted, exclusive per-CID paint JSON after the existing screenshots. Those actual computed checks and rebuilt Income200/503 screenshots have NOT run; P2 remains OPEN pending that evidence.

Source freeze before this intermediate checkpoint: current HEAD `31c2e92136ee5aacbfbc44a4299feb7925e7f368`; uncommitted Income root SHA256 `f09a9f29fb1077f0ae2fb9d1a38340ae155d56ea0757b9f1da82b19d75f6781f`, canonical test SHA256 `b88a0f438ff7e67458aedc37923bbc56c694afcdeb4af3fd1076ecc46d6123a0`, browser spec SHA256 `b5e9ea59efb0c361d5b41eabbbf36af00b7ac75dca5e11ea28ce4433a0805d7b`. Independent exact source/specification/quality and retained RED/GREEN log review passed provisionally; a future normal formatter/checkpoint must record its own exact successor identity rather than predict it. This appendix is an intermediate evidence checkpoint, not final EO closeout.

Logs under the existing evidence root: opacity-red-4bac5338cd834a9bb53c7e8d9bc9a259.log, opacity-focused-green-038120478a644afe992caa262a4d83af.log and opacity-pure-31c2e921-9fc54418dafa445fb4d67e0c91913b87.log. At08:50:02.032Z all owned node/dotnet/esbuild/chrome/API processes were gone,5198 was free and8.915GiB remained; the focused slot was released. No hooks, new UI build, API rebuild or actual browser run followed this test group. All old failed/successful runs and inventories remain preserved.

The next assigned candidate phase requires a normal checkpoint of these three source/test paths plus this qualified WO, independent exact-head review, a normal new UI build and new complete UI inventory, retained verified unchanged API/fixture/native identities, and actual14-case browser execution with computed paint and new screenshots. New before/after coverage must include the13 other output JSON files and actual content-root configuration used by API cwd backend/src/TerraFusion.API. Existing clean/identity/runtime guards remain unchanged; no old receipt is overwritten or relabeled with broader coverage.

Status: CANDIDATE_FUNCTIONAL_BROWSER_4_OF_4_PASS / QUALIFIED_RETAINED_EVIDENCE_AUDIT_COMPLETE / VISUAL_P2_REBUILT_PAINT_PENDING / PROTECTED_OS_AND_DELIVERED_REPEAT_PENDING. Coordinator owns normal push, PR, checks, independent review and protected merge. Neither this intermediate checkpoint nor prior candidate execution closes the EO; actual visual verification and browser completion at the protected delivered OS revision remain required.
