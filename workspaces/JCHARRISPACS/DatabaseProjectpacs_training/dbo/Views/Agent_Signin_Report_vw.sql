
CREATE   view Agent_Signin_Report_vw
AS
select

	-- WARNING:	The aliases for these fields should be left alone unless
	--		you also intend to update the reports that use this view:
	--		Agent_Signin_Report.rpt and Agent_Signin_Report_GEO_ID.rpt

	aphd.docket_start_date_time	as DATE,			-- I realize these are duplicates fields.
	aphd.docket_start_date_time	as TIME, 			-- PACS uses different field names than the report does for some reason,
	aphd.docket_start_date_time	as docket_start_date_time,	-- and we're not going to rebuild PACS atm, so we have dupes.
	ap.case_id			as CaseID,			-- If in the future, time is available to sync all three pieces, that will be done
	p.prop_id			as PropertyID,
	account.file_as_name		as Owner,
	pv.legal_desc			as legal_desc,
	agent_account.file_as_name	as AgentName,
	agent_account.acct_id		as AgentID,
	pv.prop_val_yr			as CaseYear,
	ap.docket_id			as docket_id,
	p.ref_id2			as ref_id2,
	pv.property_use_cd		as property_use_cd,
	p.geo_id			as geo_id

from
	property p
	inner join property_val pv on
	pv.prop_id = p.prop_id
	inner join prop_supp_assoc psa on
	psa.prop_id = pv.prop_id
	and psa.sup_num = pv.sup_num
	and psa.owner_tax_yr = pv.prop_val_yr
	inner join owner  o on
	o.prop_id = pv.prop_id
	and o.sup_num = pv.sup_num
	and o.owner_tax_yr = pv.prop_val_yr
	inner join account on
	account.acct_id = o.owner_id
	inner join _arb_protest  ap on
	ap.prop_val_yr = pv.prop_val_yr
	and ap.prop_id = pv.prop_id
	and ap.prot_complete_dt is null
	inner join _arb_protest_protest_by_assoc  appba  on
	appba.case_id = ap.case_id 
	and  appba.prop_val_yr = ap.prop_val_yr 
	--and aa.owner_id = o.owner_id
	inner join agent a on 
	a.agent_id = appba.prot_by_id
	inner join account  agent_account on
	agent_account.acct_id = a.agent_id
	left outer join agent_assoc  aa on
	aa.prop_id = ap.prop_id and
	aa.owner_tax_yr = ap.prop_val_yr
	and appba.prot_by_id = a.agent_id
	left outer join _arb_protest_hearing_docket  aphd  on
	aphd.docket_id = ap.docket_id

GO

