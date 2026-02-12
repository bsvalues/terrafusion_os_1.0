
CREATE VIEW dbo.print_statement_totals_vw
AS
select * from
(
select p.prop_type_cd as code, count(distinct p.prop_id) as count, 
wts.group_id as group_id, wts.year as year, wts.run_id as run_id,
wtsphsa.history_id as history_id

from 
wa_tax_statement_print_history_statement_assoc as wtsphsa with (nolock)
join wa_tax_statement as wts with (nolock)
on (wtsphsa.group_id = wts.group_id 
and  wtsphsa.year = wts.year 
and  wtsphsa.run_id= wts.run_id  
and  wtsphsa.prop_id = wts.prop_id )
join property as p with (nolock)
on wts.prop_id = p.prop_id

group by p.prop_type_cd, wts.group_id, wts.year,wts.run_id,wtsphsa.history_id

union
select saa.assessment_description as code, count(distinct wtsaf.statement_id)as [count],
wtsaf.group_id as group_id, wtsaf.year as year, wtsaf.run_id as run_id, history_id
from wa_tax_statement_assessment_fee as wtsaf
with (nolock)
join special_assessment_agency as saa
with (nolock)
on wtsaf.agency_id = saa.agency_id
join wa_tax_statement_print_history_statement_assoc as wtsphsa with (nolock)
on (wtsphsa.group_id = wtsaf.group_id 
and  wtsphsa.year = wtsaf.year 
and  wtsphsa.run_id= wtsaf.run_id 
and  wtsphsa.statement_id = wtsaf.statement_id)
group by saa.assessment_description, wtsaf.group_id, wtsaf.year,wtsaf.run_id,history_id
) a

GO

