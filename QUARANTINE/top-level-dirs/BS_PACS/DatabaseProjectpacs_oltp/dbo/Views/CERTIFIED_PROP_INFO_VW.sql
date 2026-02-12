
CREATE VIEW dbo.CERTIFIED_PROP_INFO_VW
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
	account.file_as_name,
	address.addr_line1,
	address.addr_line2,
	address.addr_line3,
	address.addr_city,
	address.addr_state,
	address.addr_zip,
	address.country_cd,
	address.primary_addr,
	property_val.eff_size_acres,
	property.prop_type_cd,
	property.geo_id,
	property_freeze_vw.entity_cd,
	property_freeze_vw.exmpt_type_cd,
	property_freeze_vw.freeze_yr,
	property_freeze_vw.freeze_ceiling,
	owner.roll_exemption,
	owner.roll_state_code,
	property.ref_id1,
	property.ref_id2
FROM
	account
INNER JOIN
	owner
ON
	account.acct_id = owner.owner_id
INNER JOIN
	property_val
ON
	owner.prop_id = property_val.prop_id
AND
	owner.owner_tax_yr = property_val.prop_val_yr
AND	owner.sup_num = property_val.sup_num
INNER JOIN
	property
ON
	property_val.prop_id = property.prop_id
LEFT OUTER JOIN
	property_freeze_vw
ON
	owner.prop_id = property_freeze_vw.prop_id
AND	owner.owner_id = property_freeze_vw.owner_id
AND	owner.owner_tax_yr = property_freeze_vw.exmpt_tax_yr
AND	owner.sup_num = property_freeze_vw.sup_num
LEFT OUTER JOIN
	address
ON
	owner.owner_id = address.acct_id
WHERE
	address.primary_addr = 'Y'
AND	property_val.sup_num = 0
and	property_val.prop_inactive_dt is null

GO

