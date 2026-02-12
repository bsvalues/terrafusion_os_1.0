
CREATE PROCEDURE [dbo].[Jefferson_UpdateUserPropertyValTable]

AS

SET NOCOUNT ON

-- Add any missing user_property records in user_property
UPDATE property SET gpm_irrig = 1
FROM property As a, user_property As b
WHERE a.prop_id = b.prop_id

INSERT INTO user_property (prop_id, pldd_acreage_assessed)
SELECT a.prop_id, 0
FROM property_val As a, property As b
WHERE a.prop_val_yr = (SELECT appr_yr FROM pacs_system)
AND IsNull(a.prop_inactive_dt,'1/1/1900') = '1/1/1900' AND a.sup_num = 0 
AND a.prop_id = b.prop_id AND b.prop_type_cd = 'R' AND IsNull(b.gpm_irrig,0) = 0

UPDATE property SET gpm_irrig = NULL WHERE gpm_irrig = 1

-- Add any missing user_property_val records in user_property_val
UPDATE property SET gpm_irrig = 1
FROM property As a, user_property_val As b
WHERE a.prop_id = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM pacs_system) AND b.sup_num = 0

INSERT INTO user_property_val (prop_id, prop_val_yr, sup_num, is_primary, sum_acres, benefit_acres, benefit_acre_sum, nwa_type, nwa_acres, nwa_supplemental, nwa_aggregate_pid, displaytext_massadj, displaytext_exemption)
SELECT a.prop_id, (SELECT appr_yr FROM pacs_system), 0, 0, 0, 0, 0, 0, '', 0, 0, '', ''
FROM property_val As a, property As b
WHERE a.prop_val_yr = (SELECT appr_yr FROM pacs_system)
AND IsNull(a.prop_inactive_dt,'1/1/1900') = '1/1/1900' AND a.sup_num = 0 
AND a.prop_id = b.prop_id AND b.prop_type_cd = 'R' AND IsNull(b.gpm_irrig,0) = 0

UPDATE property SET gpm_irrig = NULL WHERE gpm_irrig = 1


-- Fill display fields in user_property_val

UPDATE user_property_val SET displaytext_exemption = '' WHERE prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)

UPDATE user_property_val SET displaytext_exemption = d.exmpt_subtype_cd + ' /'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, property_exemption As d 
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND c.prop_id = d.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.owner_tax_yr
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num AND a.sup_num = d.sup_num
AND IsNull(d.exmpt_subtype_cd,'') <> ''

UPDATE user_property_val SET displaytext_exemption = displaytext_exemption + ' ' + 'FP'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, property_special_assessment As d 
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND c.prop_id = d.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.year
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num AND a.sup_num = d.sup_num
AND d.agency_id = 102

UPDATE user_property_val SET displaytext_exemption = displaytext_exemption + ' ' + 'CW'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, property_special_assessment As d 
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND c.prop_id = d.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.year
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num AND a.sup_num = d.sup_num
AND (d.agency_id = 101 OR d.agency_id = 118)

UPDATE user_property_val SET displaytext_exemption = displaytext_exemption + ' ' + 'NW'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, property_special_assessment As d 
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND c.prop_id = d.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.year
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num AND a.sup_num = d.sup_num
AND d.agency_id = 117

UPDATE user_property_val SET displaytext_exemption = Left(displaytext_exemption + ' ' + 'DD',50)
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, property_special_assessment As d 
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id AND c.prop_id = d.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.year
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num AND a.sup_num = d.sup_num
AND d.agency_id = 100

UPDATE user_property_val SET displaytext_massadj = '' WHERE prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)

UPDATE user_property_val SET displaytext_massadj = 'Ngh Imps: ' + Left(Cast(d.hood_imprv_pct As varchar(10)),3) + '% Land: ' + Left(Cast(d.hood_land_pct As varchar(10)),3) + '%'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, neighborhood As d
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.hood_yr
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num
AND b.hood_cd = d.hood_cd

UPDATE user_property_val SET displaytext_massadj = 'Cdo Imps: ' + Left(Cast(d.abs_imprv_pct As varchar(10)),3) + '% Land: ' + Left(Cast(d.abs_land_pct As varchar(10)),3) + '%'
FROM user_property_val As a, property_val As b, prop_supp_assoc As c, abs_subdv As d
WHERE a.prop_val_yr  > (SELECT appr_yr - 2 FROM pacs_system)
AND a.prop_id = b.prop_id AND b.prop_id = c.prop_id
AND a.prop_val_yr = b.prop_val_yr AND b.prop_val_yr = c.owner_tax_yr AND c.owner_tax_yr = d.abs_subdv_yr
AND a.sup_num = b.sup_num AND a.sup_num = c.sup_num
AND b.abs_subdv_cd = d.abs_subdv_cd AND d.abs_subdv_ind = 'C'

GRANT EXECUTE ON [dbo].[Jefferson_UpdateUserPropertyValTable] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_UpdateUserPropertyValTable] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateUserPropertyValTable] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateUserPropertyValTable] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

