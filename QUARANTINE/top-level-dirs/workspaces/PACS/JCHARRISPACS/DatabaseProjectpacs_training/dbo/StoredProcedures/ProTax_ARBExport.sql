
CREATE procedure ProTax_ARBExport

as

set nocount on


select
	a.prop_id,
	p.geo_id,
	a.prop_val_yr,
	a.case_id,
	ap.appraiser_nm,
	pv.hood_cd,
	case when oa.confidential_flag = 'T' then 'CONFIDENTIAL OWNER' else oa.file_as_name end as owner_name,
	pp.state_cd,
	p.prop_type_cd,
	replace(pv.legal_desc,			char(13)+char(10),' ') as legal_desc,
	dbo.fn_GetEntities(pv.prop_id,pv.prop_val_yr,pv.sup_num) as entities,
	dbo.fn_GetExemptions(pv.prop_id,pv.prop_val_yr,	pv.sup_num) as exemptions,
	replace(s.situs_display,		char(13)+char(10),' ') as situs,
	aaa.file_as_name as agent_name,
	a.prot_type,
	a.prot_status,
	dbo.fn_GetProtestReasonCodes(a.prop_id,	a.prop_val_yr,	a.case_id) as reasons,
	replace(a.prot_taxpayer_comments,	char(13)+char(10),' ') as prot_taxpayer_comments,
	appba.prot_by_type,		
	case when pa.confidential_flag = 'T' then 'CONFIDENTIAL FLAG' else pa.file_as_name end as protest_by_name,
	convert(varchar(10),a.prot_affidavit_testimony_dt,101) as taxpayer_affidavit_received_dt,
	a.prot_affidavit_testimony_by,
	a.prot_affidavit_testimony_received,
	a.docket_id,
	convert(varchar(10),ad.docket_start_date_time,		101) + ' ' + right(convert(varchar(25),ad.docket_start_date_time,	100),7) as docket_start_date_time,
	convert(varchar(10),ad.docket_end_date_time,		101) + ' ' + right(convert(varchar(25),ad.docket_end_date_time,		100),7) as docket_end_date_time,
	a.prot_hearing_rescheduled,
	a.prot_assigned_panel,
	convert(varchar(10),a.prot_arrived_dt,			101) + ' ' + right(convert(varchar(25),a.prot_arrived_dt,		100),7) as prot_arrived_dt,
	a.prot_first_motion_decision_cd,
	convert(varchar(10),a.prot_first_motion_decision_dt,	101) + ' ' + right(convert(varchar(25),a.prot_first_motion_decision_dt,	100),7) as prot_first_motion_decision_dt,
	a.prot_second_motion_decision_cd,
	convert(varchar(10),a.prot_second_motion_decision_dt,	101) + ' ' + right(convert(varchar(25),a.prot_second_motion_decision_dt,100),7) as prot_second_motion_decision_dt,
	ama.appraiser_nm as appraiser_meeting_appraiser,
	convert(varchar(10),a.appraiser_meeting_date_time,	101) + ' ' + right(convert(varchar(25),a.appraiser_meeting_date_time,	100),7) as appraiser_meeting_date_time,
	convert(varchar(10),a.prot_appr_meeting_arrived_dt,	101) + ' ' + right(convert(varchar(25),a.prot_appr_meeting_arrived_dt,	100),7) as prot_appr_meeting_arrived_dt,
	replace(a.appraiser_meeting_appraiser_comments,	char(13)+char(10),' ') as appraiser_meeting_appraiser_comments,
	replace(a.appraiser_meeting_taxpayer_comments,	char(13)+char(10),' ') as appraiser_meeting_taxpayer_comments,
	convert(varchar(10),a.prot_hearing_start_dt,		101) + ' ' + right(convert(varchar(25),a.prot_hearing_start_dt,		100),7) as prot_hearing_start_dt,
	convert(varchar(10),a.prot_hearing_finished_dt,		101) + ' ' + right(convert(varchar(25),a.prot_hearing_finished_dt,	100),7) as prot_hearing_finished_dt,
	aph.appraiser_nm,
	apr.appraiser_nm,
	dbo.fn_ProTax_GetARBPanelMembers(a.prop_id,a.prop_val_yr,a.case_id) as panel_members,
	replace(replace(a.prot_district_comments,char(13),''),char(10),' ') as prot_district_comments,
	a.prot_other_motion,
	a.prot_first_motion,
	a.prot_second_motion,
	a.begin_land_hstd_val,
	a.begin_land_non_hstd_val,
	a.begin_imprv_hstd_val,
	a.begin_imprv_non_hstd_val,
	a.begin_ag_use_val,
	a.begin_ag_market,
	a.begin_timber_use,
	a.begin_timber_market,
	a.begin_market,
	a.begin_appraised_val,
	a.begin_ten_percent_cap,
	a.begin_assessed_val,
	a.begin_rendered_val,
	a.begin_exemptions,
	a.begin_entities,
	a.final_land_hstd_val,
	a.final_land_non_hstd_val,
	a.final_imprv_hstd_val,
	a.final_imprv_non_hstd_val,
	a.final_ag_use_val,
	a.final_ag_market,
	a.final_timber_use,
	a.final_timber_market,
	a.final_market,
	a.final_appraised_val,
	a.final_ten_percent_cap,
	a.final_assessed_val,
	a.final_rendered_val,
	a.final_exemptions,
	a.final_entities

from _arb_protest as a
with (nolock)
join property as p
with (nolock)
on a.prop_id = p.prop_id
join property_val as pv
with (nolock)
on a.prop_id = pv.prop_id
and a.prop_val_yr = pv.prop_val_yr
join prop_supp_assoc as psa
with (nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
join owner as o
with (nolock)
on pv.prop_id = o.prop_id
and pv.prop_val_yr = o.owner_tax_yr
and pv.sup_num = o.sup_num
join account as oa
with (nolock)
on o.owner_id = oa.acct_id
join property_profile as pp
with (nolock)
on a.prop_id = pp.prop_id
and a.prop_val_yr = pp.prop_val_yr
left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id
left outer join situs as s
with (nolock)
on a.prop_id = s.prop_id
and s.primary_situs = 'Y'
left outer join agent_assoc as aa
with (nolock)
on a.prop_id = aa.prop_id
and a.prop_val_yr = aa.owner_tax_yr
and o.owner_id = aa.owner_id
and (aa.arb_mailings = 'T' or aa.ca_mailings  = 'T')
left outer join _arb_protest_protest_by_assoc as appba
with (nolock)
on appba.case_id = a.case_id
and appba.prop_id = a.prop_id
and appba.prop_val_yr = a.prop_val_yr
and appba.primary_protester = 1
left outer join account as aaa
with (nolock)
on aa.agent_id = aaa.acct_id
left outer join account as pa
with (nolock)
on appba.prot_by_id = pa.acct_id
left outer join _arb_protest_hearing_docket as ad
with (nolock)
on a.docket_id = ad.docket_id
left outer join appraiser as aph
with (nolock)
on a.prot_hearing_appraisal_staff = aph.appraiser_id
left outer join appraiser as apr
with (nolock)
on a.prot_hearing_recorder_id = apr.appraiser_id
left outer join appraiser as ama
with (nolock)
on a.appraiser_meeting_appraiser_id = ama.appraiser_id
order by a.prop_val_yr, a.prop_id

GO

