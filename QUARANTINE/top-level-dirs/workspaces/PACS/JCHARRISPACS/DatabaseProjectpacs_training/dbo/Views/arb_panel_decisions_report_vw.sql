

create view arb_panel_decisions_report_vw
AS
select distinct 
	owner_acct.file_as_name as owner_name, 
	isnull(agent_account.file_as_name, '') as agent_name, 
	ap.prot_type, ap.prop_id, 
	p.geo_id, 
	pv.legal_desc, 
	ap.prop_val_yr, 
	ap.case_id, 
	appr.appraiser_nm, 
	s.primary_situs, 
	s.situs_num, 
	s.situs_street_prefx, 
	s.situs_street, 
	s.situs_street_sufix, 
	s.situs_unit,
	s.situs_city, 
	s.situs_state, 
	s.situs_zip, 
	replace(s.situs_display, char(13) + char(10), ' ') as situs, 
	aphd.docket_start_date_time, 
	ap.prot_assigned_panel, 
	apd1.decision_desc as first_decision, 
	apd2.decision_desc as second_decision, 
	ap.prot_second_motion_decision_dt, 
	ap.prot_first_motion_decision_dt, 
	ap.prot_first_motion_decision_cd, 
	ap.prot_second_motion_decision_cd, 
	ap.prot_complete_dt, 
	pv.last_appraiser_id, 
	ap.appraiser_meeting_appraiser_id,
	pv.property_use_cd as property_use_cd
from
	_arb_protest as ap with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on 
	psa.prop_id = ap.prop_id
and	psa.owner_tax_yr = ap.prop_val_yr
inner join
(
	select
		min(owner_id) as owner_id,
		prop_id,
		owner_tax_yr,
		sup_num
	from
		owner with (nolock)
	group by
		prop_id,
		owner_tax_yr,
		sup_num
		
) as o
on 
	o.prop_id = psa.prop_id
and	o.owner_tax_yr = psa.owner_tax_yr
and	o.sup_num = psa.sup_num 
inner join
	account as owner_acct with (nolock)
on 
	owner_acct.acct_id = o.owner_id
inner join
	property as p with (nolock)
on 
	p.prop_id = ap.prop_id 
inner join
	property_val as pv with (nolock)
on 
	pv.prop_id = o.prop_id
and	pv.prop_val_yr = o.owner_tax_yr
and	pv.sup_num = o.sup_num 
inner join
	appraiser as appr with (nolock)
on 
	appr.appraiser_id = ap.prot_hearing_appraisal_staff
left outer join
	situs s with (nolock)
on
	s.prop_id = ap.prop_id
and	s.primary_situs = 'Y' 
left outer join
	_arb_protest_decision apd1 with (nolock)
on
	apd1.decision_cd = ap.prot_first_motion_decision_cd
left outer join
	_arb_protest_decision as apd2 with (nolock)
on
	apd2.decision_cd = ap.prot_second_motion_decision_cd
left outer join
	_arb_protest_hearing_docket as aphd with (nolock)
on 
	aphd.docket_id = ap.docket_id 
left outer join  
( 
	select
		prop_id,
		owner_id,
		owner_tax_yr,
		max(agent_id) as agent_id 
	from
		agent_assoc with (nolock)
	where
		isnull(auth_to_resolve, 'F') = 'T'
	and	isnull(exp_dt, getdate() + 1) > getdate()
	group by
		prop_id,
		owner_id,
		owner_tax_yr 
) as agi
on 
	agi.prop_id = o.prop_id
and	agi.owner_id = o.owner_id
and	agi.owner_tax_yr = o.owner_tax_yr 
left outer join
	agent_assoc as aa with (nolock)
on 
	aa.prop_id = agi.prop_id
and	aa.owner_id = agi.owner_id
and	aa.owner_tax_yr = agi.owner_tax_yr
and	aa.agent_id = agi.agent_id
left outer join
	account as agent_account with (nolock)
on 
	agent_account.acct_id = aa.agent_id
where
	ap.prot_first_motion_decision_cd <> ''
or	ap.prot_second_motion_decision_cd <> ''

GO

