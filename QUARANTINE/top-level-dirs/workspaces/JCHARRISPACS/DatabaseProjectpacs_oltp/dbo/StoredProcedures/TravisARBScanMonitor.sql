
CREATE PROCEDURE TravisARBScanMonitor

as

declare @CurrDate	datetime
declare @AdjCurrDate	datetime

set @CurrDate    = convert(varchar(10), GetDate(), 101)
--set @CurrDate    = '11/17/2004'
set @AdjCurrDate = dateadd(day, 1, @currdate)


select  a.prot_arrived_dt as 'Signed In', 
		aphd.docket_start_date_time as 'Hearing Time',
		--convert(varchar(10),a.prot_arrived_dt, 108) as 'Signed In', 
		--convert(varchar(10),aphd.docket_start_date_time, 108) as 'Hearing Time', 
		a.prop_id as 'Prop ID', 
		ac.file_as_name as 'Owner Name',
		prot_assigned_panel as 'Panel',
		case when prot_taxpayer_additional_evidence = 'T' and prot_taxpayer_additional_evidence is not null then 'Yes' else 'No' end as 'Add Evidence',
		prot_affidavit_testimony_by as 'Affidavits',
		a.case_id as 'Case ID',
		a.prop_val_yr as 'Prop_val_yr',
		ap.appraiser_nm as 'Appraiser'
       
from _arb_protest as a
with (nolock)

join _arb_protest_hearing_docket as aphd
with (nolock)
on a.docket_id = aphd.docket_id
and aphd.docket_start_date_time >= @CurrDate
and aphd.docket_start_date_time <  @AdjCurrDate

join prop_supp_assoc psa 
with (nolock)
on  psa.prop_id = a.prop_id
and psa.owner_tax_yr = a.prop_val_yr

join property_val pv
with (nolock)
on psa.prop_id = pv.prop_id
and psa.sup_num = pv.sup_num
and psa.owner_tax_yr = pv.prop_val_yr

join owner as o
with (nolock)
on  psa.prop_id = o.prop_id
and psa.sup_num = o.sup_num
and psa.owner_tax_yr = o.owner_tax_yr

join account as ac
with (nolock)
on o.owner_id = ac.acct_id

inner join _arb_protest_protest_by_assoc as appba
WITH (NOLOCK) 
ON appba.case_id = a.case_id
AND appba.prop_val_yr = a.prop_val_yr
AND appba.primary_protester = 1

join account as prot_a
with (nolock)
on appba.prot_by_id = prot_a.acct_id

left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id

left outer join agent_assoc as aa
with (nolock)
on a.prop_id = aa.prop_id and
a.prop_val_yr = aa.owner_tax_yr

left outer join account agent_name 
with (nolock)
on aa.agent_id = agent_name.acct_id

where prot_taxpayer_additional_evidence = 'T' and prot_taxpayer_additional_evidence is not null
and prot_first_motion_decision_cd is null 
and prot_complete_dt is null

order by  prot_arrived_dt,  docket_start_date_time, prot_assigned_panel,  prot_a.file_as_name

GO

