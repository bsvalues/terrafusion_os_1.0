

CREATE  procedure BexarARBSignIn

as

declare @CurrDate	datetime
declare @AdjCurrDate	datetime

set @CurrDate    = convert(varchar(10), GetDate(), 101)
set @AdjCurrDate = dateadd(day, 1, @currdate)


select
	null as 'Signed In',
	convert(varchar(10),arb_docket_schedule_vw.docket_start_date_time, 108) as 'Hearing Time', 
	arb_docket_schedule_vw.prop_id as 'Prop ID', 
	property.geo_id as 'Geo ID',
	account.file_as_name as 'Owner Name',
	prot_account.file_as_name as 'Protest By',
	pv.market as 'Market',
	situs_display as 'Situs',
	agent_name.file_as_name as 'Agent Name',
	appraiser.appraiser_nm as 'Appraiser',
	_arb_protest.prot_assigned_panel as 'Panel',
	case when _arb_protest.prot_taxpayer_additional_evidence = 'T' and _arb_protest.prot_taxpayer_additional_evidence is not null then 'Yes' else 'No' end as 'Add Evidence',
	_arb_protest.prot_affidavit_testimony_by as 'Affidavits',
	arb_docket_schedule_vw.case_id as 'Case ID',
	arb_docket_schedule_vw.prop_val_yr as 'Prop_val_yr',
	case when IsNull(pv.ag_use_val, 0) + IsNull(pv.timber_use,0) > 0 then 'Yes' else 'No' end as AG,
	case when shared_prop.pacs_prop_id is not null then 'Yes' else 'No' end as Shared,
	pv.property_use_cd as 'Prop Use Code'

from arb_docket_schedule_vw with(nolock)

join _arb_protest with(nolock) on
	arb_docket_schedule_vw.prop_id = _arb_protest.prop_id and
	arb_docket_schedule_vw.prop_val_yr = _arb_protest.prop_val_yr and
	arb_docket_schedule_vw.case_id = _arb_protest.case_id

join prop_supp_assoc as psa with(nolock) on
	psa.prop_id = arb_docket_schedule_vw.prop_id and
	psa.owner_tax_yr = arb_docket_schedule_vw.prop_val_yr

join owner with(nolock) on
	arb_docket_schedule_vw.prop_id = owner.prop_id and
	arb_docket_schedule_vw.prop_val_yr = owner.owner_tax_yr and
	psa.sup_num = owner.sup_num

join property_val as pv with(nolock) on
	arb_docket_schedule_vw.prop_id = pv.prop_id and
	arb_docket_schedule_vw.prop_val_yr = pv.prop_val_yr and
	psa.sup_num = pv.sup_num

join property with(nolock) on
	arb_docket_schedule_vw.prop_id = property.prop_id

join account with(nolock) on
	owner.owner_id = account.acct_id

inner join _arb_protest_protest_by_assoc as appba with (nolock)
ON appba.case_id = _arb_protest.case_id
AND appba.prop_val_yr = _arb_protest.prop_val_yr
AND appba.primary_protester = 1

join account as prot_account with(nolock) on
	appba.prot_by_id = prot_account.acct_id

left outer join situs with(nolock) on
	arb_docket_schedule_vw.prop_id = situs.prop_id and
	situs.primary_situs = 'Y'

left outer join agent_assoc with(nolock) on
	arb_docket_schedule_vw.prop_id = agent_assoc.prop_id and
	arb_docket_schedule_vw.prop_val_yr = agent_assoc.owner_tax_yr

left outer join account as agent_name with(nolock) on
	agent_assoc.agent_id = agent_name.acct_id

left outer join appraiser with(nolock) on
	_arb_protest.prot_hearing_appraisal_staff = appraiser.appraiser_id

left outer join shared_prop with(nolock) on
	shared_prop.pacs_prop_id = arb_docket_schedule_vw.prop_id and
	shared_prop.shared_year = arb_docket_schedule_vw.prop_val_yr and
	shared_prop.sup_num = psa.sup_num

where
	arb_docket_schedule_vw.docket_start_date_time >= @CurrDate and
	arb_docket_schedule_vw.docket_start_date_time <  @AdjCurrDate and
	_arb_protest.prot_complete_dt is null --added 

order by prot_assigned_panel, docket_start_date_time, prot_account.file_as_name

GO

