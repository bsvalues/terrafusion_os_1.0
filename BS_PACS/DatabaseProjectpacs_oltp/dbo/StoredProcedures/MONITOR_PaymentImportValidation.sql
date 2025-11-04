

CREATE procedure [dbo].MONITOR_PaymentImportValidation

@run_id datetime

as
select ip.payment_run_id, ip.prop_id, ip.primary_statement_id, ip.year
from import_payment ip with(nolock)
where ip.payment_run_id = @run_id
and not exists 
	(select * 
	from bill with(nolock)
	where prop_id = ip.prop_id
	and display_year = ip.year
	and statement_id = ip.primary_statement_id)

GO

