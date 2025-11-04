
CREATE PROCEDURE [dbo].[Jefferson_AuditCleanWaterSpecialAssessments]
  @AssessmentYear char(4)
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_CleanWater_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_CleanWater_Assessment]
END

CREATE TABLE #PACS_CleanWater_Assessment
(
 prop_id			int null,
 prop_val_yr		numeric(4,0) null,
 sup_num			int null,
 clean_water_flag   varchar(10) null,
 cwa_has_fee_now    varchar(3),
 cwa_audit_change   varchar(100),
 cwa_audit_reason   varchar(100))

INSERT INTO #PACS_CleanWater_Assessment (prop_id, prop_val_yr, sup_num, clean_water_flag, cwa_has_fee_now, cwa_audit_change, cwa_audit_reason) 
SELECT prop_id, prop_val_yr, sup_num, 'NO', 'NO', '', ''
FROM property_val WHERE prop_val_yr = @AssessYear AND sup_num = 0 AND ISNULL(prop_inactive_dt, '1/1/1900') = '1/1/1900'

UPDATE #PACS_CleanWater_Assessment SET cwa_has_fee_now = 'YES'
FROM #PACS_CleanWater_Assessment As a, property_special_assessment As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.year AND a.sup_num = b.sup_num AND (b.agency_id = 101 OR b.agency_id = 118)

 --Set all parcels to Clean Water Assessment YES
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'YES-20'
  FROM #PACS_CleanWater_Assessment As a, property As b
  WHERE a.prop_id = b.prop_id AND b.prop_type_cd = 'R'

 --Set West End to Clean Water Assessment NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc West End Parcels', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_val As b
  WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND b.hood_cd BETWEEN '2700' AND '2800' AND a.clean_water_flag = 'YES-20'

  --Set Seniors without non-senior improved value to Clean Water Assessment NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc Senior Exempt', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_exemption As b,  property_val As c
  WHERE a.prop_id = b.prop_id AND b.exmpt_tax_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND b.prop_id = c.prop_id AND b.exmpt_tax_yr = c.prop_val_yr AND b.sup_num = c.sup_num
  AND b.exmpt_type_cd = 'SNR/DSBL' AND a.clean_water_flag = 'YES-20'
  AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900' AND c.imprv_non_hstd_val < 20000

  --Set Real #PACS_CleanWater_Assessment Utilities to NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc State Assessed Utilities', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_val As b
  WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND (b.sub_type = 'UR' OR b.sub_type = 'LUR') AND a.clean_water_flag = 'YES-20'


 --Set Exempt properties to Clean Water Assessment NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc Exempt Parcels', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_exemption As b
  WHERE a.prop_id = b.prop_id AND b.exmpt_tax_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND b.exmpt_type_cd = 'EX' AND a.clean_water_flag = 'YES-20'
  AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'

 --Set taxable property < 500 to Clean Water Assessment NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc Taxable < 500', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_exemption As b
  WHERE a.prop_id = b.prop_id AND b.exmpt_tax_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND b.exmpt_type_cd = 'U500' AND a.clean_water_flag = 'YES-20'
  AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'

  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc Taxable < 500', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, wash_prop_owner_val As b
  WHERE a.prop_id = b.prop_id AND b.year = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND b.taxable_classified + b.taxable_non_classified < 500 AND a.clean_water_flag = 'YES-20'
  AND b.ag_use_val = 0

  --Set Unimproved Timber parcels to Clean Water Assessment NO
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc Unimproved Timber Parcels', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, property_val As b
  WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND a.clean_water_flag = 'YES-20' AND b.imprv_hstd_val+ b.imprv_non_hstd_val < 500 AND b.ag_use_val > 0
  AND (b.property_use_cd = '8800' or b.property_use_cd = '9500')

 --Set City and Port Ludlow Sewered parcels to Clean Water Assessment NO
   UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'NO', cwa_audit_reason = 'Exc City and Port Ludlow parcels on Sewer', cwa_audit_change = 'Remove WAT Fee'
  FROM #PACS_CleanWater_Assessment As a, prop_characteristic_assoc As b
  WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND a.clean_water_flag = 'YES-20' AND (b.characteristic_cd = 'PTSEWER' or b.characteristic_cd = 'PLSEWER')

  --Set Timeshares to Clean Water Assessment YES-5
  UPDATE #PACS_CleanWater_Assessment SET clean_water_flag = 'YES-5'
  FROM #PACS_CleanWater_Assessment As a, property_val As b
  WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (Select appr_yr FROM pacs_system) AND b.sup_num = 0
  AND a.clean_water_flag = 'YES-20' AND b.property_use_cd = '1420'

  --Set Audit Flag for Missing parcels to include
  UPDATE #PACS_CleanWater_Assessment SET cwa_audit_reason = 'Include (currently w/o fee)', cwa_audit_change = 'Add WAT Fee'
  FROM #PACS_CleanWater_Assessment
  WHERE (clean_water_flag = 'YES-20' OR clean_water_flag = 'YES-5') AND cwa_has_fee_now = 'NO'
 
 -- Properties to be audited
  SELECT c.geo_id, a.prop_id, d.file_as_name, b.property_use_cd, b.legal_desc, a.clean_water_flag, a.cwa_audit_change, a.cwa_audit_reason
  FROM #PACS_CleanWater_Assessment As a, property_val as b, property As c, account As d
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND c.col_owner_id = d.acct_id
  AND (((clean_water_flag = 'YES-20' OR clean_water_flag = 'YES-5') AND cwa_has_fee_now = 'NO')
  OR (a.clean_water_flag <> 'YES-20' AND a.clean_water_flag <> 'YES-5' AND cwa_has_fee_now = 'YES'))
  ORDER BY c.geo_id
      
GRANT EXECUTE ON [dbo].[Jefferson_AuditCleanWaterSpecialAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_AuditCleanWaterSpecialAssessments] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_AuditCleanWaterSpecialAssessments] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_AuditCleanWaterSpecialAssessments] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

