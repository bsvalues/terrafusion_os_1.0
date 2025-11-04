

create view freeze_ceiling_accept_supplement_group_run_entity_freeze_type_vw
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
	eev.set_initial_freeze_user_id
from
	entity_exmpt_vw as eev with (nolock)
where
	eev.freeze_flag = 1

GO

