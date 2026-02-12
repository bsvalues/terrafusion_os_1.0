
CREATE VIEW dbo.print_statement_message_vw
AS

select message_cd, count(distinct wts.prop_id)as count,
       wts.group_id as group_id, wts.year as year, wts.run_id as run_id,
       wtsphsa.history_id as history_id
from wa_tax_statement as wts with (nolock)
join wa_tax_statement_print_history_statement_assoc as wtsphsa with (nolock)
on (wtsphsa.group_id = wts.group_id 
and  wtsphsa.year = wts.year 
and  wtsphsa.run_id= wts.run_id 
and  wtsphsa.prop_id = wts.prop_id
and  wtsphsa.statement_id = wts.statement_id )
join tax_statement_config tsc on wts.message_cd = tsc.tax_statement_cd
where tsc.supplement_reason = 0 or wts.supp_reason is not null
group by message_cd, wts.group_id, wts.year, wts.run_id, wtsphsa.history_id, tsc.supplement_reason

GO

