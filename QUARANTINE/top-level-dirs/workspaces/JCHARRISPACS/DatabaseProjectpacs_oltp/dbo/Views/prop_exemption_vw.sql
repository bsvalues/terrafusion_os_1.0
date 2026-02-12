
CREATE VIEW dbo.prop_exemption_vw
AS
SELECT
	prop_supp_assoc.sup_num,
	prop_supp_assoc.owner_tax_yr,
	prop_supp_assoc.prop_id,
	property_exemption.owner_id,
	property_exemption.exmpt_tax_yr,
	property_exemption.owner_tax_yr AS Expr2, 
	property_exemption.prop_type_cd, 
	property_exemption.exmpt_type_cd, 
	property_exemption.applicant_nm, 
	property_exemption.birth_dt, 
	property_exemption.spouse_birth_dt, 
	property_exemption.prop_exmpt_dl_num, 
	property_exemption.prop_exmpt_ss_num, 
	property_exemption.effective_dt, 
	property_exemption.termination_dt, 
	property_exemption.apply_pct_owner, 
	property_exemption.sup_num AS Expr3, 
	property_exemption.effective_tax_yr, 
	property_val.prop_inactive_dt
FROM
	prop_supp_assoc with (nolock)
INNER JOIN
	property_val with (nolock)
ON
	prop_supp_assoc.prop_id = property_val.prop_id
AND	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
AND	prop_supp_assoc.sup_num = property_val.sup_num
AND	property_val.prop_inactive_dt IS NULL
INNER JOIN
	property_exemption with (nolock)
ON 
	prop_supp_assoc.prop_id = property_exemption.prop_id
AND	prop_supp_assoc.owner_tax_yr = property_exemption.exmpt_tax_yr
AND	prop_supp_assoc.owner_tax_yr = property_exemption.owner_tax_yr
AND	prop_supp_assoc.sup_num = property_exemption.sup_num

GO

