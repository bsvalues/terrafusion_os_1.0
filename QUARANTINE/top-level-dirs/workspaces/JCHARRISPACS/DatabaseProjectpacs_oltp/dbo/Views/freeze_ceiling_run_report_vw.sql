

create view freeze_ceiling_run_report_vw
as
select
	run.run_id,
	run.run_type_id,
	run.run_type_description,
	run.year,
	run.accepted_sup_group_id,
	detail.action_indicator,
	detail.report_sort_order,
	detail.action_message,
	eft.entity_id,
	eft.entity_cd,
	eft.entity_name,
	eft.freeze_type,
	detail.prop_id,
	detail.owner_id,
	acct.file_as_name as owner_name,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	ltrim(rtrim(sg.status_cd)) as freeze_sup_status,
	case when detail.use_freeze = 'T' then detail.freeze_ceiling else null end as freeze_ceiling,
	case when detail.use_freeze = 'T' then detail.freeze_yr else null end as freeze_yr,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run_vw as run with (nolock)
inner join
	freeze_ceiling_run_entity_freeze_type_vw as eft with (nolock)
on
	eft.run_id = run.run_id
left outer join
	freeze_ceiling_newly_approved_entity_freeze_ceiling_run_detail as detail with (nolock)
on
	detail.run_id = eft.run_id
and	detail.entity_id = eft.entity_id
and	detail.freeze_type = eft.freeze_type
and	detail.action_indicator in (2, 3)
left outer join
	account as acct with (nolock)
on
	acct.acct_id = detail.owner_id
left outer join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.tax_yr
and	s.sup_num = detail.freeze_sup_num
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	run.run_type_id = 1
and	run.undo_date is null
and
(
	run.preview_date is not null
or	run.process_date is not null
)


union


select
	run.run_id,
	run.run_type_id,
	run.run_type_description,
	run.year,
	run.accepted_sup_group_id,
	detail.action_indicator,
	detail.report_sort_order,
	detail.action_message,
	eft.entity_id,
	eft.entity_cd,
	eft.entity_name,
	eft.freeze_type,
	detail.prop_id,
	detail.owner_id,
	acct.file_as_name as owner_name,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	ltrim(rtrim(sg.status_cd)) as freeze_sup_status,
	case when detail.use_freeze = 'T' then detail.freeze_ceiling else null end as freeze_ceiling,
	case when detail.use_freeze = 'T' then detail.freeze_yr else null end as freeze_yr,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run_vw as run with (nolock)
inner join
	freeze_ceiling_run_entity_freeze_type_vw as eft with (nolock)
on
	eft.run_id = run.run_id
left outer join
	freeze_ceiling_freeze_refreeze_run_detail as detail with (nolock)
on
	detail.run_id = eft.run_id
and	detail.entity_id = eft.entity_id
and	detail.freeze_type = eft.freeze_type
and	detail.action_indicator in (2, 3)
left outer join
	account as acct with (nolock)
on
	acct.acct_id = detail.owner_id
left outer join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.tax_yr
and	s.sup_num = detail.freeze_sup_num
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	run.run_type_id = 2
and	run.undo_date is null
and
(
	run.preview_date is not null
or	run.process_date is not null
)


union


select
	run.run_id,
	run.run_type_id,
	run.run_type_description,
	run.year,
	run.accepted_sup_group_id,
	detail.action_indicator,
	detail.report_sort_order,
	detail.action_message,
	eft.entity_id,
	eft.entity_cd,
	eft.entity_name,
	eft.freeze_type,
	detail.prop_id,
	detail.owner_id,
	acct.file_as_name as owner_name,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	ltrim(rtrim(sg.status_cd)) as freeze_sup_status,
	case when detail.use_freeze = 'T' then detail.freeze_ceiling else null end as freeze_ceiling,
	case when detail.use_freeze = 'T' then detail.freeze_yr else null end as freeze_yr,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run_vw as run with (nolock)
inner join
	freeze_ceiling_run_entity_freeze_type_vw as eft with (nolock)
on
	eft.run_id = run.run_id
left outer join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = eft.run_id
and	detail.entity_id = eft.entity_id
and	detail.freeze_type = eft.freeze_type
and	detail.action_indicator in (2, 3)
left outer join
	account as acct with (nolock)
on
	acct.acct_id = detail.owner_id
left outer join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.tax_yr
and	s.sup_num = detail.freeze_sup_num
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	run.run_type_id = 3
and	run.undo_date is null
and
(
	run.preview_date is not null
or	run.process_date is not null
)


union


select
	run.run_id,
	run.run_type_id,
	run.run_type_description,
	run.year,
	run.accepted_sup_group_id,
	detail.action_indicator,
	detail.report_sort_order,
	detail.action_message,
	eft.entity_id,
	eft.entity_cd,
	eft.entity_name,
	eft.freeze_type,
	detail.prop_id,
	detail.owner_id,
	acct.file_as_name as owner_name,
	detail.tax_yr,
	detail.sup_num,
	detail.freeze_sup_num,
	ltrim(rtrim(sg.status_cd)) as freeze_sup_status,
	case when detail.use_freeze = 'T' then detail.freeze_ceiling else null end as freeze_ceiling,
	case when detail.use_freeze = 'T' then detail.freeze_yr else null end as freeze_yr,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run_vw as run with (nolock)
inner join
	freeze_ceiling_run_entity_freeze_type_vw as eft with (nolock)
on
	eft.run_id = run.run_id
left outer join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = eft.run_id
and	detail.entity_id = eft.entity_id
and	detail.freeze_type = eft.freeze_type
and	detail.action_indicator in (2, 3)
left outer join
	account as acct with (nolock)
on
	acct.acct_id = detail.owner_id
left outer join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.tax_yr
and	s.sup_num = detail.freeze_sup_num
left outer join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	run.run_type_id = 4
and	run.undo_date is null
and
(
	run.preview_date is not null
or	run.process_date is not null
)

GO

