
CREATE PROCEDURE [dbo].[Jefferson_UpdateUserPropertySpecialAssessmentTable_NWAaggregation]

AS

SET NOCOUNT ON

 -- Update Agency Aggregate Fields
  -- Add any missing user_property_special_assessment records
  UPDATE property SET gpm_irrig = 1
  FROM property As a, user_property_special_assessment As b
  WHERE a.prop_id = b.prop_id AND b.agency_id = 117

  INSERT INTO user_property_special_assessment (year, sup_num, prop_id, agency_id, nwa_forestparcel_count, nwa_nonforestparcel_count, nwa_forestacres_sum, nwa_nonforestacres_sum)
  SELECT a.prop_val_yr, 0, a.prop_id, 117, 0, 0, 0, 0
  FROM user_property_val As a, property As b
  WHERE a.prop_val_yr = (SELECT appr_yr FROM pacs_system)
  AND a.sup_num = 0 
  AND a.prop_id = b.prop_id AND a.nwa_type = 'SAG' AND IsNull(b.gpm_irrig,0) = 0

  UPDATE property SET gpm_irrig = NULL WHERE gpm_irrig = 1

  -- SET DNR Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275968
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%STATE OF WASHINGTON%'
  AND owner_id BETWEEN 28045 AND 28050
  
  -- SET WDFW Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275962
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%STATE OF WASHINGTON%'
  AND owner_id = 28051
  
  -- SET State Parks Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275963
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%STATE OF WASHINGTON%'
  AND owner_id = 28052
  
  -- SET Jefferson County Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275964
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%JEFFERSON CO%'
  AND owner_id = 18998
  
  -- SET Jefferson County ROADS Aggregate List (add trails)
  UPDATE user_property_val SET nwa_aggregate_pid = 275958
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%JEFFERSON CO%'
  AND owner_id = 18998 AND b.property_use_cd = '7610'
  
  -- SET Jefferson County PUD Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275967
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%JEFFERSON CO%'
  AND owner_id = 19003
  
  -- SET Jefferson County Port of PT Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275966
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%PORT%'
  AND owner_id = 25026
  
  -- SET City of Port Townsend Aggregate List
  UPDATE user_property_val SET nwa_aggregate_pid = 275965
  FROM user_property_val As a, property_val As b, owner As c, account As d
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr AND c.owner_id = d.acct_id
  AND a.nwa_acres <> 0  AND d.file_as_name Like '%CITY%'
  AND owner_id = 13231

  -- UPDATE AGGREAGE COUNTS AND ACREAGE
  UPDATE user_property_special_assessment
  SET nwa_forestparcel_count = nwa_count, nwa_forestacres_sum = nwa_acres_ttl 
  FROM user_property_special_assessment As a, 
  (SELECT nwa_aggregate_pid, COUNT(nwa_aggregate_pid) As nwa_count, SUM(nwa_acres) As nwa_acres_ttl FROM user_property_val 
  WHERE sup_num = 0 AND prop_val_yr = (Select appr_yr FROM pacs_system) AND nwa_type = 'TBR' AND IsNull(nwa_aggregate_pid,0) <> 0 GROUP BY nwa_aggregate_pid) As b
  WHERE a.prop_id = b.nwa_aggregate_pid AND a.year = (Select appr_yr FROM pacs_system) AND a.sup_num = 0 and a.agency_id = 117

  UPDATE user_property_special_assessment
  SET nwa_nonforestparcel_count = nwa_count, nwa_nonforestacres_sum = nwa_acres_ttl 
  FROM user_property_special_assessment As a, 
  (SELECT nwa_aggregate_pid, COUNT(nwa_aggregate_pid) As nwa_count, SUM(Isnull(nwa_acres,0)) As nwa_acres_ttl FROM user_property_val 
  WHERE sup_num = 0 AND prop_val_yr = (Select appr_yr FROM pacs_system) AND nwa_type = 'NTB' AND IsNull(nwa_aggregate_pid,0) <> 0 GROUP BY nwa_aggregate_pid) As b
  WHERE a.prop_id = b.nwa_aggregate_pid AND a.year = (Select appr_yr FROM pacs_system) AND a.sup_num = 0 and a.agency_id = 117


GRANT EXECUTE ON [dbo].[Jefferson_UpdateUserPropertySpecialAssessmentTable_NWAaggregation] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_UpdateUserPropertySpecialAssessmentTable_NWAaggregation] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateUserPropertySpecialAssessmentTable_NWAaggregation] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateUserPropertySpecialAssessmentTable_NWAaggregation] TO PUBLIC
    AS [dbo];


GO

