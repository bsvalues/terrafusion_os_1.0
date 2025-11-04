

 
CREATE procedure [dbo].[Monitor_H1_DUE_NoBID_NoDelinq]
 
@tax_yr int
 
as
 
SET NOCOUNT ON


select b.prop_id, b.display_year, b.statement_id, 
sum(bpd.amount_due - bpd.amount_paid) h1_due
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join bill_payments_due bpd with(nolock)
on bpd.bill_id = b.bill_id
and bpd.bill_payment_id = 0
where b.display_year = @tax_yr
and (bpd.amount_due - bpd.amount_paid) > 0  --- everything that has a balance due for 2024 
and b.prop_id not in    ------------------That are not in 
	(select b1.prop_id 
		from bill b1 with (nolock)
		where b1.display_year < = (select tax_yr from pacs_system)
		group by b1.prop_id
		having sum (b1.current_amount_due - b1.amount_paid) > 0) --- delinquents that are unpaid 
and b.prop_id  in (select b2.prop_id
	from bill b2 with (nolock)
	join assessment_bill ab with (nolock)
	on b2.bill_id = ab.bill_id 
	join special_assessment_agency saa with (nolock)
	on ab.agency_id = saa.agency_id 
	where saa.agency_id < >  521)
and b.prop_id not in (select b3.prop_id 
	from bill b3 with(nolock)
	join property p with(nolock)
	on p.prop_id = b3.prop_id
	join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b3.bill_id
	and bpd.bill_payment_id = 1
	where b3.display_year = @tax_yr
	and (bpd.amount_due - bpd.amount_paid) > 0)

group by b.prop_id, b.display_year, b.statement_id

GO

