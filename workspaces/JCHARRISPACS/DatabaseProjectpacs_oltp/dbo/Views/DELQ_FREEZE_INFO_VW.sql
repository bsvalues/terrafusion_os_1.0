
CREATE VIEW dbo.DELQ_FREEZE_INFO_VW
AS
SELECT
	property_val.prop_id,
	property_val.sup_num,
	property_val.prop_val_yr,
	property_val.land_hstd_val,
	property_val.land_non_hstd_val,
	property_val.imprv_hstd_val,
	property_val.imprv_non_hstd_val,
	property_val.appraised_val,
	property_val.assessed_val,
	property_val.market,
	property_val.ag_use_val,
	property_val.ag_market,
	property_val.ag_loss,
	property_val.ag_late_loss,
	property_val.timber_78,
	property_val.timber_market,
	property_val.timber_use,
	property_val.timber_loss,
	property_val.timber_late_loss,
	property_val.legal_desc,
	property_val.legal_desc_2,
	property_val.legal_acreage,
	owner.owner_id,
	owner.pct_ownership,
	prop_supp_assoc.owner_tax_yr,
	prop_supp_assoc.sup_num AS Expr1,
	property_freeze_vw.entity_cd,
	property_freeze_vw.exmpt_type_cd,
	property_freeze_vw.freeze_yr,
	property_freeze_vw.freeze_ceiling
FROM
	owner
INNER JOIN
	property_val
INNER JOIN
	prop_supp_assoc
ON	property_val.prop_id = prop_supp_assoc.prop_id
AND	property_val.sup_num = prop_supp_assoc.sup_num
AND	property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
ON
	owner.prop_id = prop_supp_assoc.prop_id
AND	owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
AND	owner.sup_num = prop_supp_assoc.sup_num
LEFT OUTER JOIN
	property_freeze_vw
ON	owner.owner_id = property_freeze_vw.owner_id
AND	owner.owner_tax_yr = property_freeze_vw.exmpt_tax_yr
AND	owner.prop_id = property_freeze_vw.prop_id
AND	owner.sup_num = property_freeze_vw.sup_num
WHERE
	prop_supp_assoc.owner_tax_yr IN
	(
	SELECT
		MAX(owner_tax_yr)
	FROM
		prop_supp_assoc AS psa,
		pacs_system
	WHERE
		psa.prop_id = property_val.prop_id
	AND	owner_tax_yr <= pacs_system.tax_yr
	)

GO

