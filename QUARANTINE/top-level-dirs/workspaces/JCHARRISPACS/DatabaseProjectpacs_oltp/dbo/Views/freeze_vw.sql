
CREATE VIEW dbo.freeze_vw
AS
SELECT
	prop_id,
	owner_id,
	entity_id,
	exmpt_tax_yr,
	owner_tax_yr
	sup_num,
	exmpt_type_cd,
	use_freeze,
	transfer_dt,
	prev_tax_due,
	prev_tax_nofrz,
	freeze_yr,
	freeze_ceiling,
	transfer_pct,
	transfer_pct_override,
	freeze_override
FROM
	property_freeze with (nolock)

GO

