
 
CREATE procedure [dbo].[Monitor_H1DueNoDelqs]
 
@tax_yr int
 
as
 
SET NOCOUNT ON
 

select b.prop_id, b.display_year, b.statement_id, sum(bpd.amount_due - bpd.amount_paid) h1_due
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join bill_payments_due bpd with(nolock)
on bpd.bill_id = b.bill_id
and bpd.bill_payment_id = 0
where b.display_year = 2024 --@tax_yr
and (bpd.amount_due - bpd.amount_paid) > 0
and b.prop_id not in
	(select b.prop_id 
		from bill b with (nolock)
		where b.display_year < = (select tax_yr from pacs_system)
		group by b.prop_id
		having sum (b.current_amount_due - b.amount_paid) > 0)
group by b.prop_id, b.display_year, b.statement_id

GO

