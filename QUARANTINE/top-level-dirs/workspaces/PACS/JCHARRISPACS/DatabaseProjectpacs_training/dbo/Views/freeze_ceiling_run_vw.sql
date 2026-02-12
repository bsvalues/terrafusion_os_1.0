

create view freeze_ceiling_run_vw
as
select
	fcr.run_id,
	fcr.year,
	fcr.run_type_id,
	isnull(fcrt.run_type_description, '') as run_type_description,
	fcr.supplement_properties,
	fcr.sup_group_id,
	fcr.sup_cd,
	fcr.sup_desc,
	fcr.preview_date,
	fcr.preview_user_id,
	preview_user.pacs_user_name as preview_user_pacs_name,
	preview_user.full_name as preview_user_full_name,
	fcr.process_date,
	fcr.process_user_id,
	process_user.pacs_user_name as process_user_pacs_name,
	process_user.full_name as process_user_full_name,
	fcr.undo_date,
	fcr.undo_user_id,
	undo_user.pacs_user_name as undo_user_pacs_name,
	undo_user.full_name as undo_user_full_name,
	fcr.accepted_sup_group_id
from
	freeze_ceiling_run as fcr with (nolock)
left outer join
	freeze_ceiling_run_type as fcrt with (nolock)
on
	fcrt.run_type_id = fcr.run_type_id
left outer join
	pacs_user as preview_user with (nolock)
on
	preview_user.pacs_user_id = fcr.preview_user_id
left outer join
	pacs_user as process_user with (nolock)
on
	process_user.pacs_user_id = fcr.process_user_id
left outer join
	pacs_user as undo_user with (nolock)
on
	undo_user.pacs_user_id = fcr.undo_user_id

GO

