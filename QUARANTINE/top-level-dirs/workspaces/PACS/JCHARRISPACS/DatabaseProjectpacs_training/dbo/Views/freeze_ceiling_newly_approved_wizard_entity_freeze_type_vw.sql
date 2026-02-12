

create view freeze_ceiling_newly_approved_wizard_entity_freeze_type_vw
as
select
	eev.entity_id,
	eev.entity_cd,
	eev.entity_name,
	eev.entity_type_cd,
	eev.exmpt_type_cd as freeze_type,
	eev.exmpt_tax_yr as freeze_ceiling_yr,
	eev.freeze_flag,
	eev.transfer_flag,
	eev.set_initial_freeze_date,
	eev.set_initial_freeze_user_id,
	isnull(tr.enable_freeze_ceiling_calculation, 0) as enable_freeze_ceiling_calculation,
	convert(bit, case when set_initial_freeze_run.freeze_ceiling_yr is null then 1 else 0 end) as initial_year,
	tr.bills_created_dt
from
	entity_exmpt_vw as eev with (nolock)
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = eev.entity_id
and	tr.tax_rate_yr = eev.exmpt_tax_yr
left outer join
(
	select
		ee.entity_id,
		ltrim(rtrim(ee.exmpt_type_cd)) as freeze_type,
		min(exmpt_tax_yr) as freeze_ceiling_yr
	from
		entity_exmpt as ee with (nolock)
	where
		ee.freeze_flag = 1
	and	ee.exmpt_tax_yr > 0
	group by
		ee.entity_id,
		ltrim(rtrim(ee.exmpt_type_cd))
) as set_initial_freeze_run
on
	set_initial_freeze_run.entity_id = eev.entity_id
and	set_initial_freeze_run.freeze_type = eev.exmpt_type_cd
and	set_initial_freeze_run.freeze_ceiling_yr < eev.exmpt_tax_yr
where
	eev.freeze_flag = 1
and	eev.entity_type_cd <> 'S'
and	eev.set_initial_freeze_date is null

GO

