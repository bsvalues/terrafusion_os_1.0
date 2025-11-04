







CREATE    PROCEDURE TravisARBMISAgent

as

declare @CurrDate	datetime
declare @AdjCurrDate	datetime

set @CurrDate    = convert(varchar(10), GetDate(), 101)
--set @CurrDate    = '11/17/2004'
set @AdjCurrDate = dateadd(day, 1, @currdate)


select 	a.prot_arrived_dt as 'Signed In',
		_arb_protest_hearing_docket.docket_start_date_time as 'Hearing Time',
		--convert(varchar(10),a.prot_arrived_dt, 101) + ' ' + 
		--right(convert(varchar(20),a.prot_arrived_dt, 100), 7) as 'Signed In', 
		--right(convert(varchar(20),_arb_protest_hearing_docket.docket_start_date_time, 100), 7) as 'Hearing Time', 
		a.prop_id as 'Prop ID', 
		ac.file_as_name as 'Owner Name',
		prot_ac.file_as_name as 'Protest By',
		ab.protest_by_desc as 'Protest By Type',
		pv.hood_cd as 'NBHD',
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.market), 1), 1) - 1) as 'Market',
		p.prop_type_cd as 'Property Type',
		dbo.fn_GetProtestReasonCodes( a.prop_id, a.prop_val_yr, a.case_id) AS 'Protest Reason Codes',
		a.prot_affidavit_testimony_by as 'Affidavits',
		p.ref_id2 as 'Ref ID2',
		pp.imprv_type_cd as 'Improvement Type',
		agent_name.file_as_name as 'Agent Name',
		a.prot_status as 'Status Code',
		a.case_id as 'Case ID',
		a.prop_val_yr as 'Prop_val_yr',
		ap.appraiser_nm as 'Appraiser',
		IsNull((select convert(varchar(25), Max(dtCreate)) from _arb_letter_history
		
where lLetterID = 313
and   lCaseID = a.case_id
and   lPropValYr = a.prop_val_yr), '') as 'Packet Generated',
		pv.rgn_cd as 'Region'
       
from _arb_protest as a
with (nolock)

join _arb_protest_hearing_docket
with (nolock)
on  a.docket_id = _arb_protest_hearing_docket.docket_id
and _arb_protest_hearing_docket.docket_start_date_time >= @CurrDate
and _arb_protest_hearing_docket.docket_start_date_time <  @AdjCurrDate

join prop_supp_assoc as psa 
with (nolock)
on  psa.prop_id = a.prop_id
and psa.owner_tax_yr = a.prop_val_yr

join owner as o
with (nolock)
on  psa.prop_id = o.prop_id
and psa.sup_num = o.sup_num
and psa.owner_tax_yr = o.owner_tax_yr

join property_val as pv
with (nolock)
on psa.prop_id = pv.prop_id
and psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num

join property as p
with (nolock)
on psa.prop_id = p.prop_id

join account as ac
with (nolock)
on o.owner_id = ac.acct_id

inner join _arb_protest_protest_by_assoc as appba
WITH (NOLOCK) 
ON appba.case_id = a.case_id
AND appba.prop_val_yr = a.prop_val_yr
AND appba.primary_protester = 1

join account as prot_ac
with (nolock)
on appba.prot_by_id = prot_ac.acct_id

join _arb_protest_by as ab 
with (nolock) 
on appba.prot_by_type = ab.protest_by_cd 

left outer join appraiser as ap
with (nolock)
on pv.last_appraiser_id = ap.appraiser_id

left outer join agent_assoc as aa
with (nolock)
on  a.prop_id = aa.prop_id
and a.prop_val_yr = aa.owner_tax_yr

left outer join account as agent_name 
with (nolock)
on aa.agent_id = agent_name.acct_id

left outer join property_profile as pp
with (nolock)
on psa.prop_id = pp.prop_id 
and psa.sup_num = pp.sup_num 
and psa.owner_tax_yr = pp.prop_val_yr

where prot_arrived_dt is not null
and (prot_assigned_panel is null or prot_assigned_panel = 'NONE')
and prot_complete_dt is null
and appba.prot_by_type in ('AG','ANR')

order by docket_start_date_time, prot_arrived_dt

GO

