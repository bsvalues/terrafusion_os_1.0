

create view freeze_ceiling_verification_wizard_entity_freeze_type_vw
as
select
	eev.entity_id,
	eev.entity_cd,
	eev.entity_name,
	eev.entity_type_cd,
	eev.exmpt_type_cd as freeze_type,
	eev.exmpt_tax_yr as freeze_ceiling_yr,
	eev.freeze_flag,
	eev.set_initial_freeze_date,
	eev.set_initial_freeze_user_id,
	isnull(tr.enable_freeze_ceiling_calculation, 0) as enable_freeze_ceiling_calculation,
	tr.bills_created_dt
from
	entity_exmpt_vw as eev with (nolock)
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = eev.entity_id
and	tr.tax_rate_yr = eev.exmpt_tax_yr
where
	eev.freeze_flag = 1

GO

