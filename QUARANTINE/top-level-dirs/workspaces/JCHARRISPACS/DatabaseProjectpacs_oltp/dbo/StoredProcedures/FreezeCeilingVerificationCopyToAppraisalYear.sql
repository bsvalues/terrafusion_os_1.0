




create procedure FreezeCeilingVerificationCopyToAppraisalYear
	@run_id int
as




-- Create records for the current appraisal year, if it is the year following the selected year.
-- Only freezes calculated for the selected year will be considered for carrying forward to the
-- current appraisal year.
insert into
	freeze_ceiling_verification_run_detail
(
	run_id,
	run_type_id,
	action_indicator,
	action_message,
	report_sort_order,
	prop_type_cd,
	prop_id,
	owner_id,
	entity_id,
	tax_yr,
	sup_num,
	freeze_type,
	prev_yr_qualify_yr,
	missing_freeze,
	prev_yr_transfer_dt,
	prev_yr_prev_tax_due,
	prev_yr_prev_tax_nofrz,
	prev_yr_use_freeze,
	prev_yr_freeze_ceiling,
	prev_yr_freeze_yr,
	prev_yr_transfer_pct,
	prev_yr_transfer_pct_override,
	prev_yr_pacs_freeze,
	prev_yr_pacs_freeze_date,
	prev_yr_pacs_freeze_ceiling,
	prev_yr_pacs_freeze_run,
	prev_yr_freeze_override,
	calculated_freeze_ceiling,
	calculated_freeze_yr
)
select
	detail.run_id,
	detail.run_type_id,
	-1,					-- action_indicator
	'Freeze calculated in previous year.',	-- action_message,
	-1,					-- report_sort_order
	detail.prop_type_cd,
	detail.prop_id,
	-1,					-- owner_id
	detail.entity_id,
	ps.appr_yr,
	-1,					-- sup_num
	detail.freeze_type,
	detail.qualify_yr,
	missing_freeze,
	prev_yr_transfer_dt,
	prev_yr_prev_tax_due,
	prev_yr_prev_tax_nofrz,
	prev_yr_use_freeze,
	prev_yr_freeze_ceiling,
	prev_yr_freeze_yr,
	prev_yr_transfer_pct,
	prev_yr_transfer_pct_override,
	prev_yr_pacs_freeze,
	prev_yr_pacs_freeze_date,
	prev_yr_pacs_freeze_ceiling,
	prev_yr_pacs_freeze_run,
	prev_yr_freeze_override,
	detail.calculated_freeze_ceiling,
	detail.calculated_freeze_yr
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.action_indicator = 2	-- freeze ceiling has been calculated / applied
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = (detail.tax_yr + 1)
inner join
	pacs_year as py with (nolock)
on
	py.tax_yr = ps.appr_yr
and	py.certification_dt is null
where
	fcr.run_id = @run_id
and not exists
(
	select
		*
	from
		freeze_ceiling_verification_run_detail with (nolock)
	where
		run_id = detail.run_id
	and	prop_id = detail.prop_id
	and	owner_id = -1
	and	entity_id = detail.entity_id
	and	tax_yr = ps.appr_yr
	and	sup_num = -1
	and	freeze_type = detail.freeze_type
)



-- Retrieve the freeze flag for the rows in the current appraisal year
update
	freeze_ceiling_verification_run_detail
set
	freeze_flag = ee.freeze_flag
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	entity_exmpt as ee with (nolock)
on
	ee.entity_id = detail.entity_id
and	ltrim(rtrim(ee.exmpt_type_cd)) = detail.freeze_type
and	ee.exmpt_tax_yr = detail.tax_yr
where
	fcr.run_id = @run_id




-- Retrieve the property / owner info for the rows in the current appraisal year
update
	freeze_ceiling_verification_run_detail
set
	owner_id = o.owner_id,
	sup_num = psa.sup_num,
	freeze_sup_num = psa.sup_num
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = detail.prop_id
and	psa.owner_tax_yr = detail.tax_yr
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
inner join
	owner as o with (nolock)
on
	o.prop_id = pv.prop_id
and	o.owner_tax_yr = pv.prop_val_yr
and	o.sup_num = pv.sup_num
where
	fcr.run_id = @run_id




-- Retrieve the supplement information for the rows in the current appraisal year
update
	freeze_ceiling_verification_run_detail
set
	sup_group_id = sg.sup_group_id,
	sup_status = ltrim(rtrim(sg.status_cd))
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.tax_yr
and	s.sup_num = detail.sup_num
inner join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	fcr.run_id = @run_id



-- Retrieve entity info for the rows in the current appraisal year
update
	freeze_ceiling_verification_run_detail
set
	curr_yr_entity_id = epa.entity_id
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	entity_prop_assoc as epa with (nolock)
on
	epa.entity_id = detail.entity_id
and	epa.prop_id = detail.prop_id
and	epa.tax_yr = detail.tax_yr
and	epa.sup_num = detail.sup_num
where
	fcr.run_id = @run_id



-- Retrieve exemption / freeze info for the rows in the current appraisal year
update
	freeze_ceiling_verification_run_detail
set
	exmpt_type_cd = ltrim(rtrim(pe.exmpt_type_cd)),
	qualify_yr = pe.qualify_yr,
	transfer_dt = pf.transfer_dt,
	prev_tax_due = pf.prev_tax_due,
	prev_tax_nofrz = pf.prev_tax_nofrz,
	use_freeze = pf.use_freeze,
	freeze_ceiling = pf.freeze_ceiling,
	freeze_yr = pf.freeze_yr,
	transfer_pct = pf.transfer_pct,
	transfer_pct_override = pf.transfer_pct_override,
	pacs_freeze = pf.pacs_freeze,
	pacs_freeze_date = pf.pacs_freeze_date,
	pacs_freeze_ceiling = pf.pacs_freeze_ceiling,
	pacs_freeze_run = pf.pacs_freeze_run,
	freeze_override = pf.freeze_override
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
and	detail.freeze_flag = 1
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	property_exemption as pe with (nolock)
on
	pe.prop_id = detail.prop_id
and	pe.owner_id = detail.owner_id
and	pe.owner_tax_yr = detail.tax_yr
and	pe.exmpt_tax_yr = detail.tax_yr
and	pe.sup_num = detail.sup_num
and	ltrim(rtrim(pe.exmpt_type_cd)) = detail.freeze_type
left outer join
	property_freeze as pf with (nolock)
on
	pf.prop_id = pe.prop_id
and	pf.owner_id = pe.owner_id
and	pf.entity_id = detail.entity_id
and	pf.owner_tax_yr = pe.owner_tax_yr
and	pf.exmpt_tax_yr = pe.exmpt_tax_yr
and	pf.sup_num = pe.sup_num
and	ltrim(rtrim(pf.exmpt_type_cd)) = ltrim(rtrim(pe.exmpt_type_cd))
where
	fcr.run_id = @run_id
	



-- Retrieve property_entity_exemption
update
	freeze_ceiling_verification_run_detail
set
	local_exemption_amt = isnull(pee.local_amt, 0),
	state_exemption_amt = isnull(pee.state_amt, 0)
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
left outer join
(
	select
		prop_id,
		owner_id,
		entity_id,
		owner_tax_yr,
		exmpt_tax_yr,
		sup_num,
		sum(isnull(local_amt, 0)) as local_amt,
		sum(isnull(state_amt, 0)) as state_amt
	from
		property_entity_exemption with (nolock)
	group by
		prop_id,
		owner_id,
		entity_id,
		owner_tax_yr,
		exmpt_tax_yr,
		sup_num
) as pee
on
	pee.prop_id = detail.prop_id
and	pee.owner_id = detail.owner_id
and	pee.entity_id = detail.entity_id
and	pee.owner_tax_yr = detail.tax_yr
and	pee.exmpt_tax_yr = detail.tax_yr
and	pee.sup_num = detail.sup_num
where
	fcr.run_id = @run_id



-- Retrieve prop_owner_entity_val info
update
	freeze_ceiling_verification_run_detail
set
	land_hstd_val = poev.land_hstd_val,
	imprv_hstd_val = poev.imprv_hstd_val,
	ten_percent_cap = poev.ten_percent_cap
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	prop_owner_entity_val as poev with (nolock)
on
	poev.prop_id = detail.prop_id
and	poev.owner_id = detail.owner_id
and	poev.entity_id = detail.entity_id
and	poev.sup_yr = detail.tax_yr
and	poev.sup_num = detail.sup_num
where
	fcr.run_id = @run_id



-- Retrieve freeze ceiling calculation flag
update
	freeze_ceiling_verification_run_detail
set
	enable_freeze_ceiling_calculation = isnull(tr.enable_freeze_ceiling_calculation, 0)
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_verification_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.action_indicator < 0
and	detail.report_sort_order < 0
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = detail.tax_yr
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = detail.entity_id
and	tr.tax_rate_yr = detail.tax_yr
where
	fcr.run_id = @run_id

GO

