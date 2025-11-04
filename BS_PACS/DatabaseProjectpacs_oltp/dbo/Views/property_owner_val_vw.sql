
CREATE VIEW dbo.property_owner_val_vw
AS
SELECT
	property_val.prop_id, 
	property_val.prop_val_yr,
	property_val.prop_val, 
	property_val.chg_dt,
	property_val.vit_flag, 
	property_val.notice_mail_dt,
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
	property_val.rendered_val, 
	property_val.rendered_yr,
	property_val.new_val, 
	property_val.new_yr,
	property_val.mineral_int_pct, 
	property_val.ten_percent_cap, 
	property_val.orig_appraised_val,
	property_val.sup_num, 
	property_val.legal_desc,
	property_val.legal_desc_2, 
	property_val.abated_pct,
	property_val.abated_amt, 
	property_val.abated_yr,
	property_val.eff_size_acres, 
	property_val.shared_prop_val, 
	property_val.shared_prop_cad_code, 
	property_val.legal_acreage,
	property_val.recalc_flag, 
	property_val.vit_declaration_filed_dt,
	property_val.sup_cd, 
	property_val.sup_dt,
	property_val.sup_desc, 
	property_val.sup_action,
	owner.pct_ownership, 
	owner.apply_pct_exemptions,
	owner.hs_prop, 
	owner.type_of_int,
	account.file_as_name,
	account.last_name, 
	account.first_name,
	owner.owner_id,
	property_freeze.entity_cd,
	property_freeze.exmpt_type_cd, 
	property_freeze.freeze_yr, 
	property_freeze.freeze_ceiling
FROM
	owner
INNER JOIN
	account
ON
	owner.owner_id = account.acct_id
INNER JOIN
	prop_supp_assoc
INNER JOIN
	property_val
ON 
	prop_supp_assoc.prop_id = property_val.prop_id AND 
	prop_supp_assoc.sup_num = property_val.sup_num AND 
	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
ON 
	owner.prop_id = prop_supp_assoc.prop_id
AND	owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
AND	owner.sup_num = prop_supp_assoc.sup_num
LEFT OUTER JOIN
	property_freeze_vw as property_freeze
ON
	owner.prop_id = property_freeze.prop_id
AND	owner.owner_id = property_freeze.owner_id
AND	owner.owner_tax_yr = property_freeze.exmpt_tax_yr
AND	owner.sup_num = property_freeze.sup_num

GO

