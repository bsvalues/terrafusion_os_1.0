

create view freeze_ceiling_run_entity_freeze_type_vw
as
select
	fcreft.run_id,
	fcreft.entity_id,
	ltrim(rtrim(e.entity_cd)) as entity_cd,
	a.file_as_name as entity_name,
	ltrim(rtrim(e.entity_type_cd)) as entity_type_cd,
	ltrim(rtrim(fcreft.freeze_type)) as freeze_type
from
	freeze_ceiling_run_entity_freeze_type as fcreft with (nolock)
inner join
	entity as e with (nolock)
on
	e.entity_id = fcreft.entity_id
inner join
	account as a with (nolock)
on
	a.acct_id = e.entity_id

GO

