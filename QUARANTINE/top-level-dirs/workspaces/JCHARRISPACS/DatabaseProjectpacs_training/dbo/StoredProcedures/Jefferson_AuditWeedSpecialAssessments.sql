
CREATE PROCEDURE [dbo].[Jefferson_AuditWeedSpecialAssessments]
  @AssessmentYear char(4)
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_NoxiousWeed_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_NoxiousWeed_Assessment]
END

CREATE TABLE #PACS_NoxiousWeed_Assessment
(
 prop_id			int null,
 prop_val_yr		numeric(4,0) null,
 sup_num			int null,
 nwa_type		    varchar(3) null,
 nwa_acres          int null,
 nwa_supplemental	numeric(18,4) null,
 nwa_aggregate_pid	int null,
 nwa_has_fee_now    varchar(3),
 nwa_audit_change   varchar(100),
 nwa_audit_reason   varchar(100))

INSERT INTO #PACS_NoxiousWeed_Assessment (prop_id, prop_val_yr, sup_num, nwa_type, nwa_acres, nwa_supplemental, nwa_aggregate_pid, nwa_has_fee_now, nwa_audit_change, nwa_audit_reason) 
SELECT prop_id, prop_val_yr, sup_num, 'NTB', 0, nwa_supplemental, nwa_aggregate_pid, 'NO', '', ''
FROM user_property_val WHERE prop_val_yr = @AssessYear AND nwa_type <> 'SAG'

UPDATE #PACS_NoxiousWeed_Assessment SET nwa_has_fee_now = 'YES'
FROM #PACS_NoxiousWeed_Assessment As a, property_special_assessment As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.year AND a.sup_num = b.sup_num AND b.agency_id = 117

--Make sure personal property is excluded
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Personal Parcel', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property As b
  WHERE a.prop_id = b.prop_id AND b.prop_type_cd <> 'R'
  AND prop_val_yr = (Select appr_yr FROM pacs_system) AND sup_num = 0

--Make sure inactive property is excluded
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Inactive Parcel', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND IsNull(b.prop_inactive_dt,'1/1/1900') <> '1/1/1900'
  
--Set Water Areas and Marinas to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Water Area Parcel', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND (b.property_use_cd BETWEEN '9300' AND '9399' or b.property_use_cd BETWEEN '7440' AND '7449')
  
 --Set Seniors without non-senior improved value to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Senior Exempt', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b,  property_val As c
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id
  AND a.prop_val_yr = b.exmpt_tax_yr AND b.exmpt_tax_yr = c.prop_val_yr
  AND a.sup_num = b.sup_num AND b.sup_num = c.sup_num
  AND b.exmpt_type_cd = 'SNR/DSBL'
  AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900' AND c.imprv_non_hstd_val < 20000
 
--Set Real Property State Assessed Utilities to NO (assess land parcels owned by utilities separately)
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc State Assessed Utilities', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND (b.sub_type = 'UR' OR b.sub_type = 'LUR')
 
 --Set taxable property < 500 to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Taxable < 500', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND a.sup_num = b.sup_num
  AND b.exmpt_type_cd = 'U500'AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'
 
  --Set Federal Exempt properties to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Federal Land Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND a.sup_num = b.sup_num
  AND b.exmpt_type_cd = 'EX' AND exmpt_subtype_cd = 'FEDERAL' AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'
  
  --Set Tribal Exempt properties to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Tribal Land Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND a.sup_num = b.sup_num
  AND b.exmpt_type_cd = 'EX' AND exmpt_subtype_cd = 'INDIAN' AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'
   
--Set Common Area properties to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Common Area Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_exemption As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND a.sup_num = b.sup_num
  AND b.exmpt_type_cd = 'EX' AND exmpt_subtype_cd = 'CA' AND IsNull(b.termination_dt,'1/1/1900') = '1/1/1900'
  
--Set basic road definitions Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc R/W parcels' WHERE prop_id between 10002 AND 10008
 
 --Set Imps Only Mobiles to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Imps Only Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND (b.property_use_cd = '1102' or b.property_use_cd = '1103' or b.property_use_cd = '9900') AND Isnull(b.legal_acreage,0) = 0 AND Isnull(nwa_supplemental, 0) = 0  
 
 --Set Other Imps Only to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Imps Only', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND (b.property_use_cd = '9800' OR b.legal_desc Like '%IMPROVE%' OR b.legal_desc Like '%IMPS ONLY%') AND Isnull(b.legal_acreage,0) = 0 AND Isnull(nwa_supplemental, 0) = 0
  AND b.land_non_hstd_val + b.land_hstd_val = 0

 --Set Undefined Ownerships to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc Undefined Ownerships', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b, owner As c
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr
  AND (c.owner_id = '18780' OR c.owner_id = '24168') AND Isnull(b.legal_acreage,0) = 0 AND Isnull(nwa_supplemental, 0) = 0

 --Set State lands rights of way and tidelands to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc State R/W and Tidelands', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b, owner As c
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr
  AND (c.owner_id = '28049' OR c.owner_id = '28050' OR c.owner_id = '28051' OR c.owner_id = '28052' OR c.owner_id = '28052' OR c.owner_id = '13231'  OR c.owner_id = '18998') AND (b.legal_desc LIKE '%TL TAX%' OR b.legal_desc LIKE '%R 0F W%' OR b.legal_desc LIKE '%R/W%')
  AND Isnull(b.legal_acreage,0) = 0 AND Isnull(nwa_supplemental, 0) = 0

-- Set DOT parcels to Noxious Weed Assessment NO
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'NO', nwa_audit_reason = 'Exc DOT Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b, owner As c
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND b.prop_val_yr = c.owner_tax_yr
  AND (c.owner_id = '28048' OR c.owner_id = '28046') AND Isnull(nwa_supplemental, 0) = 0  

 --Set Timber parcels to Noxious Weed Assessment YES-TBR
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'TBR'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND (b.property_use_cd = '8800' or b.property_use_cd = '9500'  or b.property_use_cd = '9710'  or b.property_use_cd = '9720'  or b.property_use_cd = '9725')

  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'TBR'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b, land_detail As c
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND a.nwa_type = 'NTB' AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.prop_val_yr AND a.sup_num = b.sup_num AND b.sup_num = c.sup_num
  AND b.property_use_cd = '8300' AND c.state_cd = '88' AND c.size_acres > 10

 --Set Weed Acres values
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_acres = (SELECT CEILING(CAST (b.legal_acreage AS FLOAT)))
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_acres = 1
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND a.nwa_acres = 0 AND Left(b.property_use_cd,2) <> '97'  AND Left(b.property_use_cd,2) <> '76'
  
 --Set Remaining Exempt parcels not added
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_type = 'N', nwa_audit_reason = 'Exc Remaining Exempt Parcels', nwa_audit_change = 'Remove NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment As a, property_val As b
  WHERE a.prop_val_yr = (Select appr_yr FROM pacs_system) AND (a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND a.sup_num = 0
  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND a.nwa_acres = 0 AND (Left(b.property_use_cd,2) = '97'
  OR Left(b.property_use_cd,2) = '76') AND Isnull(nwa_supplemental, 0) = 0
 
  --Set Audit Flag for Missing parcels to include
  UPDATE #PACS_NoxiousWeed_Assessment SET nwa_audit_reason = 'Include (currently w/o fee)', nwa_audit_change = 'Add NWA Fee'
  FROM #PACS_NoxiousWeed_Assessment
  WHERE (nwa_type = 'NTB' OR nwa_type = 'TBR') AND nwa_has_fee_now = 'NO'
 
 -- Properties to be audited
  SELECT c.geo_id, a.prop_id, d.file_as_name, b.property_use_cd, b.legal_desc, a.nwa_type, nwa_acres, a.nwa_audit_change, a.nwa_audit_reason
  FROM #PACS_NoxiousWeed_Assessment As a, property_val as b, property As c, account As d
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND b.prop_id = c.prop_id AND c.col_owner_id = d.acct_id
  AND (((a.nwa_type = 'NTB' OR a.nwa_type = 'TBR') AND nwa_has_fee_now = 'NO')
  OR (a.nwa_type <> 'NTB' AND a.nwa_type <> 'TBR' AND nwa_has_fee_now = 'YES'))
  ORDER BY c.geo_id   
    
GRANT EXECUTE ON [dbo].[Jefferson_AuditWeedSpecialAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_AuditWeedSpecialAssessments] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_AuditWeedSpecialAssessments] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_AuditWeedSpecialAssessments] TO PUBLIC
    AS [dbo];


GO

