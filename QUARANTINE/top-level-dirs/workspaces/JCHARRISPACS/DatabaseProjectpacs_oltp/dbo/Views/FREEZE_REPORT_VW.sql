
CREATE VIEW dbo.FREEZE_REPORT_VW
AS
SELECT
	property_freeze_vw.owner_name,
	property.prop_id,
	property.geo_id,
	property_val.legal_desc,
	property_freeze_vw.entity_cd,
	property_freeze_vw.exmpt_type_cd,
	property_freeze_vw.freeze_yr,
	property_freeze_vw.freeze_ceiling,
	property_freeze_vw.pacs_freeze_date,
	property_freeze_vw.owner_id,
	property_freeze_vw.owner_tax_yr,
	property_freeze_vw.sup_num,
	property_freeze_vw.pacs_freeze_run
FROM
	property
INNER JOIN
	prop_supp_assoc
ON
	property.prop_id = prop_supp_assoc.prop_id
INNER JOIN
	property_val
ON
	prop_supp_assoc.prop_id = property_val.prop_id
AND	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
AND	prop_supp_assoc.sup_num = property_val.sup_num
INNER JOIN
	property_freeze_vw
ON
	property_val.prop_id = property_freeze_vw.prop_id
AND	property_val.prop_val_yr = property_freeze_vw.exmpt_tax_yr
AND	property_val.prop_val_yr = property_freeze_vw.owner_tax_yr
AND	property_val.sup_num = property_freeze_vw.sup_num

GO

