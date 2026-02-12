
CREATE PROCEDURE TravisARBPending

as

declare @CurrDate	datetime
declare @AdjCurrDate	datetime

set @CurrDate    = convert(varchar(10), GetDate(), 101)
set @CurrDate = dateadd(day, -2, @CurrDate)

if datepart(dw, @CurrDate) = 7 or datepart(dw, @CurrDate) = 1
begin
	set @CurrDate = dateadd(day, -2, @CurrDate)
end

--set @CurrDate    = '11/17/2004'
set @AdjCurrDate = convert(varchar(10), GetDate(), 101)


select 	_arb_protest_hearing_docket.docket_start_date_time as 'Hearing Date Time',
		--convert(varchar(10),_arb_protest_hearing_docket.docket_start_date_time, 101) as 'Hearing Date', 
		--convert(varchar(10),_arb_protest_hearing_docket.docket_start_date_time, 108) as 'Hearing Time', 
		a.prop_id as 'Prop ID', 
		a.case_id as 'Case ID',
		prot_ac.file_as_name as 'Protest By',
		ab.protest_by_desc as 'Protest By Type',
		pv.hood_cd as 'NBHD',
		LEFT(CONVERT(varchar(20), CONVERT(money, pv.market), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pv.market), 1), 1) - 1) as 'Market',
		a.prop_val_yr as 'Prop_Val_Yr',
		ap.appraiser_nm as 'Appraiser'
       
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

join property_val as pv
with (nolock)
on psa.prop_id = pv.prop_id
and psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num

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

where prot_status = 'PDE'
and prot_complete_dt is null

order by docket_start_date_time, prot_arrived_dt

GO

