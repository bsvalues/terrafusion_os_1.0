




create procedure FreezeCeilingAcceptSupplementGroupInitialization
	@run_id int
as



-- delete any existing data for the same run id (indicates that this is probably a 'Process' run following a 'Preview' run)
exec FreezeCeilingAcceptSupplementGroupDeletion @run_id



-- Identify potential freeze ceilings
insert into
	freeze_ceiling_accept_supplement_group_run_detail
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
	curr_yr_entity_id,
	exmpt_type_cd,
	qualify_yr,
	freeze_flag,
	set_initial_freeze_date,
	udi_parent_prop_id,
	udi_status,
	freeze_sup_num
)	
select
	@run_id,
	fcr.run_type_id,
	-1,			-- action_indicator
	'Initialized',		-- action_message
	-1,			-- report_sort_order
	ltrim(rtrim(p.prop_type_cd)),
	pv.prop_id,
	o.owner_id,
	fcreft.entity_id,
	pv.prop_val_yr,
	pv.sup_num,
	fcreft.freeze_type,
	epa.entity_id,
	ltrim(rtrim(pe.exmpt_type_cd)),
	pe.qualify_yr,
	ee.freeze_flag,
	ee.set_initial_freeze_date,
	pv.udi_parent_prop_id,
	pv.udi_status,
	pv.sup_num
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_run_type as fcrt with (nolock)
on
	fcrt.run_type_id = fcr.run_type_id
and	fcrt.run_type_id = 4
inner join
	freeze_ceiling_run_entity_freeze_type as fcreft with (nolock)
on
	fcreft.run_id = fcr.run_id
inner join
	pacs_system as ps with (nolock)
on
	ps.appr_yr = fcr.year
inner join
	entity_exmpt as ee with (nolock)
on
	ee.entity_id = fcreft.entity_id
and	ltrim(rtrim(ee.exmpt_type_cd)) = fcreft.freeze_type
and	ee.exmpt_tax_yr = ps.appr_yr
inner join
	entity_prop_assoc as epa with (nolock)
on
	epa.entity_id = ee.entity_id
and	epa.tax_yr = ee.exmpt_tax_yr
inner join
	property_exemption as pe with (nolock)
on
	pe.prop_id = epa.prop_id
and	pe.owner_tax_yr = epa.tax_yr
and	pe.exmpt_tax_yr = epa.tax_yr
and	pe.sup_num = epa.sup_num
and	ltrim(rtrim(pe.exmpt_type_cd)) = ltrim(rtrim(ee.exmpt_type_cd))
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = epa.prop_id
and	psa.owner_tax_yr = epa.tax_yr
and	psa.sup_num = epa.sup_num
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
inner join
	property as p with (nolock)
on
	p.prop_id = pv.prop_id
inner join
	owner as o with (nolock)
on
	o.owner_id = pe.owner_id
and	o.prop_id = pv.prop_id
and	o.owner_tax_yr = pv.prop_val_yr
and	o.sup_num = pv.sup_num

where
	fcr.run_id = @run_id
and	fcr.process_date is null
and	fcr.undo_date is null



-- Retrieve supplement info for the year associated with the freeze ceiling run
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	sup_group_id = sg.sup_group_id,
	sup_status = ltrim(rtrim(sg.status_cd))
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
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



-- Delete rows that are in supplement 0 if the year is certified
delete
	freeze_ceiling_accept_supplement_group_run_detail
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.sup_num = 0
inner join
	pacs_year as py with (nolock)
on
	py.tax_yr = detail.tax_yr
and	py.certification_dt is not null
where
	fcr.run_id = @run_id



-- Delete rows that are not in supplement 0 and not in the designated supplement group
delete
	freeze_ceiling_accept_supplement_group_run_detail
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.sup_num <> 0
and	isnull(detail.sup_group_id, -1) <> fcr.accepted_sup_group_id
where
	fcr.run_id = @run_id



-- Retrieve freeze ceiling info for the year associated with the freeze ceiling run
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	transfer_dt = pf.transfer_dt,
	prev_tax_due = pf.prev_tax_due,
	prev_tax_nofrz = pf.prev_tax_nofrz,
	use_freeze = pf.use_freeze,
	freeze_ceiling = pf.freeze_ceiling,
	freeze_yr = pf.freeze_yr,
	transfer_pct =
		case
			when pf.transfer_pct is not null then pf.transfer_pct
			when pf.transfer_dt is not null then
				case
					when isnull(pf.prev_tax_nofrz, 0.0) = 0.0 then 0.0
					else ((isnull(pf.prev_tax_due, 0.0) / pf.prev_tax_nofrz) * 100)
				end
			else pf.transfer_pct
		end,
	transfer_pct_override = pf.transfer_pct_override,
	pacs_freeze = pf.pacs_freeze,
	pacs_freeze_date = pf.pacs_freeze_date,
	pacs_freeze_ceiling = pf.pacs_freeze_ceiling,
	pacs_freeze_run = pf.pacs_freeze_run,
	freeze_override = pf.freeze_override
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	property_freeze as pf with (nolock)
on
	pf.prop_id = detail.prop_id
and	pf.owner_id = detail.owner_id
and	pf.entity_id = detail.entity_id
and	pf.owner_tax_yr = detail.tax_yr
and	pf.exmpt_tax_yr = detail.tax_yr
and	pf.sup_num = detail.sup_num
and	ltrim(rtrim(pf.exmpt_type_cd)) = detail.freeze_type
where
	fcr.run_id = @run_id



-- Retrieve property_entity_exemption info for the year associated with the freeze ceiling run
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	local_exemption_amt = isnull(pee.local_amt, 0),
	state_exemption_amt = isnull(pee.state_amt, 0)
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
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




-- Retrieve prop_owner_entity_val info for the year associated with the freeze ceiling run
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	land_hstd_val = poev.land_hstd_val,
	imprv_hstd_val = poev.imprv_hstd_val,
	ten_percent_cap = poev.ten_percent_cap
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
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


	

--Retrieve property / owner info from the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_tax_yr = pv.prop_val_yr,
	prev_yr_sup_num = pv.sup_num,
	prev_yr_owner_id = o.owner_id
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = detail.prop_id
and	psa.owner_tax_yr = (detail.tax_yr - 1)
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
inner join
	property as p with (nolock)
on
	p.prop_id = pv.prop_id
inner join
	owner as o with (nolock)
on
	o.prop_id = pv.prop_id
and	o.owner_tax_yr = pv.prop_val_yr
and	o.sup_num = pv.sup_num
where
	fcr.run_id = @run_id





-- Retrieve supplement info for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_sup_group_id = sg.sup_group_id,
	prev_yr_sup_status = ltrim(rtrim(sg.status_cd))
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	supplement as s with (nolock)
on
	s.sup_tax_yr = detail.prev_yr_tax_yr
and	s.sup_num = detail.prev_yr_sup_num
inner join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
where
	fcr.run_id = @run_id




-- Delete rows that are in supplement 0 and not in the designated supplement group for the previous year
delete
	freeze_ceiling_accept_supplement_group_run_detail
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
and	detail.tax_yr = fcr.year
and	detail.sup_num = 0
and	isnull(detail.prev_yr_sup_group_id, -1) <> fcr.accepted_sup_group_id
where
	fcr.run_id = @run_id



-- Retrieve entity info for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_entity_id = epa.entity_id
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	entity_prop_assoc as epa with (nolock)
on
	epa.entity_id = detail.entity_id
and	epa.prop_id = detail.prop_id
and	epa.tax_yr = detail.prev_yr_tax_yr
and	epa.sup_num = detail.prev_yr_sup_num
where
	fcr.run_id = @run_id



-- Retrieve exemption information for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_exmpt_type_cd = ltrim(rtrim(pe.exmpt_type_cd)),
	prev_yr_qualify_yr = pe.qualify_yr
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	property_exemption as pe with (nolock)
on
	pe.prop_id = detail.prop_id
and	pe.owner_id = detail.prev_yr_owner_id
and	pe.owner_tax_yr = detail.prev_yr_tax_yr
and	pe.exmpt_tax_yr = detail.prev_yr_tax_yr
and	pe.sup_num = detail.prev_yr_sup_num
and	ltrim(rtrim(pe.exmpt_type_cd)) = freeze_type
where
	fcr.run_id = @run_id



-- Retrieve freeze ceiling info for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_transfer_dt = pf.transfer_dt,
	prev_yr_prev_tax_due = pf.prev_tax_due,
	prev_yr_prev_tax_nofrz = pf.prev_tax_nofrz,
	prev_yr_use_freeze = pf.use_freeze,
	prev_yr_freeze_ceiling = pf.freeze_ceiling,
	prev_yr_freeze_yr = pf.freeze_yr,
	prev_yr_transfer_pct =
		case
			when pf.transfer_pct is not null then pf.transfer_pct
			when pf.transfer_dt is not null then
				case
					when isnull(pf.prev_tax_nofrz, 0.0) = 0.0 then 0.0
					else ((isnull(pf.prev_tax_due, 0.0) / pf.prev_tax_nofrz) * 100)
				end
			else pf.transfer_pct
		end,
	prev_yr_transfer_pct_override = pf.transfer_pct_override,
	prev_yr_pacs_freeze = pf.pacs_freeze,
	prev_yr_pacs_freeze_date = pf.pacs_freeze_date,
	prev_yr_pacs_freeze_ceiling = pf.pacs_freeze_ceiling,
	prev_yr_pacs_freeze_run = pf.pacs_freeze_run,
	prev_yr_freeze_override = pf.freeze_override
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	property_freeze as pf with (nolock)
on
	pf.prop_id = detail.prop_id
and	pf.owner_id = detail.prev_yr_owner_id
and	pf.entity_id = detail.prev_yr_entity_id
and	pf.owner_tax_yr = detail.prev_yr_tax_yr
and	pf.exmpt_tax_yr = detail.prev_yr_tax_yr
and	pf.sup_num = detail.prev_yr_sup_num
and	ltrim(rtrim(pf.exmpt_type_cd)) = detail.prev_yr_exmpt_type_cd
where
	fcr.run_id = @run_id




-- Retrieve property_entity_exemption info for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_local_exemption_amt = isnull(pee.local_amt, 0),
	prev_yr_state_exemption_amt = isnull(pee.state_amt, 0)
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
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
and	pee.owner_id = detail.prev_yr_owner_id
and	pee.entity_id = detail.prev_yr_entity_id
and	pee.owner_tax_yr = detail.prev_yr_tax_yr
and	pee.exmpt_tax_yr = detail.prev_yr_tax_yr
and	pee.sup_num = detail.prev_yr_sup_num
where
	fcr.run_id = @run_id




-- Retrieve prop_owner_entity_val info for the previous year
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_land_hstd_val = poev.land_hstd_val,
	prev_yr_imprv_hstd_val = poev.imprv_hstd_val,
	prev_yr_ten_percent_cap = poev.ten_percent_cap
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	prop_owner_entity_val as poev with (nolock)
on
	poev.prop_id = detail.prop_id
and	poev.owner_id = detail.prev_yr_owner_id
and	poev.entity_id = detail.prev_yr_entity_id
and	poev.sup_yr = detail.prev_yr_tax_yr
and	poev.sup_num = detail.prev_yr_sup_num
where
	fcr.run_id = @run_id


	

-- Retrieve tax rate info for the previous year
-- (Note that we're not using detail.prev_yr_entity_id and detail.prev_yr_tax_yr since a property may not exist in that year)
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	prev_yr_m_n_o_tax_pct = tr.m_n_o_tax_pct,
	prev_yr_i_n_s_tax_pct = tr.i_n_s_tax_pct
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = detail.entity_id
and	tr.tax_rate_yr = (detail.tax_yr - 1)
where
	fcr.run_id = @run_id



--- Retrieve tax rate info
update
	freeze_ceiling_accept_supplement_group_run_detail
set
	enable_freeze_ceiling_calculation = isnull(tr.enable_freeze_ceiling_calculation, 0)
from
	freeze_ceiling_run as fcr with (nolock)
inner join
	freeze_ceiling_accept_supplement_group_run_detail as detail with (nolock)
on
	detail.run_id = fcr.run_id
inner join
	tax_rate as tr with (nolock)
on
	tr.entity_id = detail.entity_id
and	tr.tax_rate_yr = detail.tax_yr
where
	fcr.run_id = @run_id

GO

