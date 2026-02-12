
CREATE VIEW [dbo].[property_roll_history_vw]
AS 
SELECT	property_val.prop_id, property_val.prop_val_yr,
	property_val.sup_num, account.file_as_name,
	owner.pct_ownership
FROM account 
INNER JOIN owner
INNER JOIN prop_supp_assoc
INNER JOIN property_val
ON 	prop_supp_assoc.prop_id = property_val.prop_id AND 
	prop_supp_assoc.sup_num = property_val.sup_num AND 
	prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr

ON 	owner.prop_id = prop_supp_assoc.prop_id
AND	owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr
AND	owner.sup_num = prop_supp_assoc.sup_num

ON	owner.owner_id = account.acct_id

GO

