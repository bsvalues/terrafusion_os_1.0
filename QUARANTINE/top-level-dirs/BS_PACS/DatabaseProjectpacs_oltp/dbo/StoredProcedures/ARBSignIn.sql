

create  procedure ARBSignIn
with recompile
as

declare @CurrDate	datetime
declare @AdjCurrDate	datetime

--for debugging
--set @CurrDate  = '9/8/2002'--
--set @AdjCurrDate = dateadd(day, 1, GetDate() )
--
set @CurrDate    = convert(varchar(10), GetDate(), 101)
set @AdjCurrDate = dateadd(day, 1, @currdate)


select convert(varchar(10),_arb_protest.prot_arrived_dt, 108) as 'Signed In', 
       convert(varchar(10),_arb_protest_hearing_docket.docket_start_date_time, 108) as 'Hearing Time', 
       _arb_protest.prop_id as 'Prop ID', 
       account.file_as_name as 'Owner Name',
       prot_account.file_as_name as 'Protest By',
       pv.market as 'Market',
       agent_name.file_as_name as 'Agent Name',
       appraiser.appraiser_nm as 'Appraiser',
       prot_assigned_panel as 'Panel',
       case when prot_taxpayer_additional_evidence = 'T' and prot_taxpayer_additional_evidence is not null then 'Yes' else 'No' end as 'Add Evidence',
	prot_affidavit_testimony_by as 'Affidavits',
	_arb_protest.case_id as 'Case ID',
        _arb_protest.prop_val_yr as 'Prop_val_yr',
	pv.hood_cd as 'NBHD', 
        dbo.fn_GetProtestReasonCodes( _arb_protest.prop_id, _arb_protest.prop_val_yr, _arb_protest.case_id) AS 'Protest Reason Codes'
       
from 
_arb_protest with (nolock)

inner join _arb_protest_hearing_docket  with (nolock) on _arb_protest.docket_id = _arb_protest_hearing_docket.docket_id
and   _arb_protest_hearing_docket.docket_start_date_time >= @CurrDate
and   _arb_protest_hearing_docket.docket_start_date_time <  @AdjCurrDate

inner join prop_supp_assoc psa  with (nolock) on  psa.prop_id = _arb_protest.prop_id
and   psa.owner_tax_yr = _arb_protest.prop_val_yr

inner join property_val pv  with (nolock) on psa.prop_id = pv.prop_id
and psa.sup_num = pv.sup_num
and psa.owner_tax_yr = pv.prop_val_yr

inner join owner  with (nolock) on  psa.prop_id = owner.prop_id
and   psa.sup_num = owner.sup_num
and   psa.owner_tax_yr = owner.owner_tax_yr

inner join account  with (nolock) on  owner.owner_id = account.acct_id

inner join _arb_protest_protest_by_assoc as appba with (nolock)
ON appba.case_id = _arb_protest.case_id
AND appba.prop_val_yr = _arb_protest.prop_val_yr
AND appba.primary_protester = 1

inner join account prot_account  with (nolock) on appba.prot_by_id = prot_account.acct_id


left outer join agent_assoc  with (nolock) on
_arb_protest.prop_id = agent_assoc.prop_id and
_arb_protest.prop_val_yr = agent_assoc.owner_tax_yr

left outer join account agent_name  with (nolock) on
agent_assoc.agent_id = agent_name.acct_id

left outer join appraiser  with (nolock) on
_arb_protest.prot_hearing_appraisal_staff = appraiser.appraiser_id

order by  prot_assigned_panel, docket_start_date_time, prot_arrived_dt,  prot_account.file_as_name

GO

