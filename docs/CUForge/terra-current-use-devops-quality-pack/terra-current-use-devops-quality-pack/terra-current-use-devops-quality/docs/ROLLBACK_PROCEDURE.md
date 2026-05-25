# Current Use Release Rollback Procedure

## If frontend breaks

1. Disable `current-use` Workbench tab.
2. Leave backend deployed.
3. Preserve persisted calculation data.
4. Open defect against tab registration or component import.

## If backend breaks

1. Switch frontend to mock adapter.
2. Disable real API flag.
3. Keep tab visible only in internal-alpha.
4. Preserve all TerraTrace records.

## If calculation defect is found

1. Disable rollback calculator action.
2. Mark affected calculations as requiring review.
3. Do not delete calculations.
4. Add corrected calculation as new version.
5. Append TerraTrace correction event.

## If notice defect is found

1. Disable notice preview.
2. Preserve generated drafts.
3. Append correction event if any draft was used in review.
