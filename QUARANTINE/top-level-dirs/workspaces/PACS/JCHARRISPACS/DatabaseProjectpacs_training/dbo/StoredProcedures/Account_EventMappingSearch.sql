

CREATE procedure [dbo].[Account_EventMappingSearch]

@acct_num varchar(259)

as

select fa.fin_account_id, fa.account_number, 
 case when fefa.action = 0 then 'debit'
  when fefa.action = 1 then 'credit' end action, 
 fefa.event_cd, year, levy_cd as district
from fin_account fa with(nolock)
join fin_event_fund_assoc fefa
 on fa.fin_account_id = fefa.fin_account_id
where fa.account_number like '%' + @acct_num + '%'            

union

select fa.fin_account_id, fa.account_number, 
 case when feaa.action = 0 then 'debit'
  when feaa.action = 1 then 'credit' end action, 
 feaa.event_cd, year, assessment_description
from fin_account fa with(nolock)
join fin_event_assessment_assoc feaa
 on fa.fin_account_id = feaa.fin_account_id
join special_assessment_agency saa
 on feaa.agency_id = saa.agency_id
where fa.account_number like '%' + @acct_num + '%'            

union

select fa.fin_account_id, fa.account_number, 
 case when fefta.action = 0 then 'debit'
  when fefta.action = 1 then 'credit' end action, 
 fefta.event_cd, null, fee_type_cd
from fin_account fa with(nolock)
join fin_event_fee_type_assoc fefta
 on fa.fin_account_id = fefta.fin_account_id
where fa.account_number like '%' + @acct_num + '%'            

union

select fa.fin_account_id, fa.account_number, 
 case when feopc.action = 0 then 'debit'
  when feopc.action = 1 then 'credit' end action, 
 feopc.event_cd, null, 'opc'
from fin_account fa with(nolock)
join fin_event_overpmt_credit_assoc feopc
 on fa.fin_account_id = feopc.fin_account_id
where fa.account_number like '%' + @acct_num + '%'            

union

select fa.fin_account_id, fa.account_number, 
 case when ferra.action = 0 then 'debit'
  when ferra.action = 1 then 'credit' end action, 
 ferra.event_cd, null, (cast(tax_district_id as varchar (15))+ ' ' + description)
from fin_account fa with(nolock)
join fin_event_reet_rate_assoc ferra
 on fa.fin_account_id = ferra.fin_account_id
where fa.account_number like '%' + @acct_num + '%'            

union

select fa.fin_account_id, fa.account_number, 
 case when ferga.action = 0 then 'debit'
  when ferga.action = 1 then 'credit' end action, 
 ferga.event_cd, null, 'global'
from fin_account fa with(nolock)
join fin_event_reet_global_assoc ferga
 on fa.fin_account_id = ferga.fin_account_id
where fa.account_number like '%' + @acct_num + '%'

GO

