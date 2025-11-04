



CREATE    PROCEDURE TravisARBSignInAgent

as

declare @CurrDate varchar(10)
declare @AdjCurrDate varchar(10)

declare @strSQL varchar(4000)
--for debugging
--set @CurrDate  = '11/16/2004'
--set @AdjCurrDate = dateadd(day, 1, @CurrDate)
--

set @CurrDate    = convert(varchar(10), GetDate(), 101)
set @AdjCurrDate = convert(varchar(10), dateadd(day, 1, @CurrDate), 101)


--set @strSQL = 'select right(convert(varchar(20), _arb_protest.prot_arrived_dt, 100), 7) as ''Signed In'', '
--set @strSQL = @strSQL + 'right(convert(varchar(20),_arb_protest_hearing_docket.docket_start_date_time, 100), 7) as ''Hearing Time'', '
set @strSQL = 'select _arb_protest.prot_arrived_dt as ''Signed In'', '
set @strSQL = @strSQL + '_arb_protest_hearing_docket.docket_start_date_time as ''Hearing Time'', '
set @strSQL = @strSQL + '_arb_protest.prot_status as ''Status Code'', '
set @strSQL = @strSQL + '_arb_protest.prop_id as ''Prop ID'', '
set @strSQL = @strSQL + 'p.geo_id as ''Geo ID'', '
set @strSQL = @strSQL + 'p.prop_type_cd as ''Property Type'', '
set @strSQL = @strSQL + 'account.file_as_name as ''Owner Name'', '
set @strSQL = @strSQL + 'prot_account.file_as_name as ''Protest By'', '
set @strSQL = @strSQL + 'ab.protest_by_desc as ''Protest By Type'', '
set @strSQL = @strSQL + 'agent_name.file_as_name as ''Agent Name'', '
set @strSQL = @strSQL + 'prot_affidavit_testimony_by as ''Affidavits'', '
set @strSQL = @strSQL + '_arb_protest.case_id as ''Case ID'', '
set @strSQL = @strSQL + '_arb_protest.prop_val_yr as ''Prop_val_yr'', '
set @strSQL = @strSQL + 'pv.hood_cd as ''NBHD'', '
set @strSQL = @strSQL + 'pv.market as ''Market Value'', '
set @strSQL = @strSQL + 'pf.imprv_type_cd as ''Imprv Type Code'', '
set @strSQL = @strSQL + 'ap.appraiser_nm as ''Appraiser'' '
       
set @strSQL = @strSQL + 'from _arb_protest '
set @strSQL = @strSQL + 'with (nolock) '

set @strSQL = @strSQL + 'inner join _arb_protest_hearing_docket '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on  _arb_protest.docket_id = _arb_protest_hearing_docket.docket_id '

set @strSQL = @strSQL + 'inner join prop_supp_assoc psa '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on  psa.prop_id = _arb_protest.prop_id '
set @strSQL = @strSQL + 'and psa.owner_tax_yr = _arb_protest.prop_val_yr '

set @strSQL = @strSQL + 'join property as p '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on _arb_protest.prop_id = p.prop_id '

set @strSQL = @strSQL + 'join property_val as pv '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on psa.prop_id = pv.prop_id '
set @strSQL = @strSQL + 'and psa.owner_tax_yr = pv.prop_val_yr '
set @strSQL = @strSQL + 'and psa.sup_num = pv.sup_num '

set @strSQL = @strSQL + 'left outer join property_profile as pf '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on psa.prop_id = pf.prop_id '
set @strSQL = @strSQL + 'and psa.owner_tax_yr = pf.prop_val_yr '
set @strSQL = @strSQL + 'and psa.sup_num = pf.sup_num '

set @strSQL = @strSQL + 'inner join owner '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on   psa.prop_id = owner.prop_id '
set @strSQL = @strSQL + 'and  psa.sup_num = owner.sup_num '
set @strSQL = @strSQL + 'and  psa.owner_tax_yr = owner.owner_tax_yr '

set @strSQL = @strSQL + 'inner join account '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on  owner.owner_id = account.acct_id '

set @strSQL = @strSQL + 'inner join _arb_protest_protest_by_assoc as appba '
set @strSQL = @strSQL + 'with (nolock)'
set @strSQL = @strSQL + 'ON appba.case_id = _arb_protest.case_id '
set @strSQL = @strSQL + 'AND appba.prop_val_yr = _arb_protest.prop_val_yr '
set @strSQL = @strSQL + 'AND appba.primary_protester = 1'

set @strSQL = @strSQL + 'inner join account prot_account '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on appba.prot_by_id = prot_account.acct_id '

set @strSQL = @strSQL + 'join _arb_protest_by as ab '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on appba.prot_by_type = ab.protest_by_cd '

set @strSQL = @strSQL + 'left outer join appraiser as ap '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.last_appraiser_id = ap.appraiser_id '

set @strSQL = @strSQL + 'left outer join agent_assoc '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on  _arb_protest.prop_id = agent_assoc.prop_id '
set @strSQL = @strSQL + 'and _arb_protest.prop_val_yr = agent_assoc.owner_tax_yr '

set @strSQL = @strSQL + 'left outer join account agent_name '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on agent_assoc.agent_id = agent_name.acct_id '

set @strSQL = @strSQL + 'where _arb_protest.prot_arrived_dt is null '
set @strSQL = @strSQL + 'and _arb_protest.prot_complete_dt is null '
set @strSQL = @strSQL + 'and _arb_protest_hearing_docket.docket_start_date_time >= ''' + @CurrDate + ''' '
set @strSQL = @strSQL + 'and _arb_protest_hearing_docket.docket_start_date_time < ''' + @AdjCurrDate + ''' '
set @strSQL = @strSQL + 'and appba.prot_by_type IN (''AG'',''ANR'') '

set @strSQL = @strSQL + 'order by  docket_start_date_time, prot_arrived_dt, prot_account.file_as_name '

exec(@strSQL)

GO

