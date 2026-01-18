-- Patch generated from docs/reports/Benton_County_2026_Residential_Market_Calibration.md
-- Generated at: 2026-01-18T17:53:17.790341+00:00
BEGIN TRANSACTION;

UPDATE RES_depre_matrix 
SET factor = 39.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '70'
  AND factor = 80.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 40.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '999'
  AND factor = 80.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 40.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '75'
  AND factor = 80.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 53.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '60'
  AND factor = 90.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 55.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '999'
  AND factor = 90.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 55.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '75'
  AND factor = 90.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 55.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '70'
  AND factor = 90.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 36.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '60'
  AND factor = 70.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 51.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '50'
  AND factor = 85.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 32.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '999'
  AND factor = 65.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 32.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '75'
  AND factor = 65.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 34.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '50'
  AND factor = 65.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 50.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '45'
  AND factor = 80.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 30.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '70'
  AND factor = 60.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 26.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '50'
  AND factor = 55.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 33.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'POOR' 
  AND axis_type = 'age' 
  AND axis_value = '45'
  AND factor = 60.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 23.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'NML' 
  AND axis_type = 'age' 
  AND axis_value = '999'
  AND factor = 50.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 42.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'VPO' 
  AND axis_type = 'age' 
  AND axis_value = '0'
  AND factor = 15.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 28.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '60'
  AND factor = 55.0; -- Optimistic concurrency check
UPDATE RES_depre_matrix 
SET factor = 24.0, last_modified = CURRENT_TIMESTAMP, modification_source = 'Benton_2026_Calibration'
WHERE segment = 'BLN' 
  AND axis_type = 'age' 
  AND axis_value = '45'
  AND factor = 50.0; -- Optimistic concurrency check

COMMIT;