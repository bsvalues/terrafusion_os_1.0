

CREATE procedure [dbo].[_monitor_2yrdelq_props]


/***********
This monitor will return a list of all properties that have missed the half payment specified in the current tax year.

Inputs are tax year, half payment due date, payment date, half payment
***********/

----------------{Call _monitor_2yrdelq_props] (2019)}


@begin_date datetime,
@end_date datetime



as

SET NOCOUNT ON





select b.prop_id, b.display_year, b.statement_id, p.geo_id,
sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) base_due, a.file_as_name,
ad.addr_line1 as address, ad.addr_city as city, ad.addr_state as state, ad.addr_zip as zip, s.situs_num, 
s.situs_street, s.situs_city, s.situs_state, s.situs_zip
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
INNER JOIN address ad WITH (nolock) ON
	a.acct_id = ad.acct_id
--join bill_payments_due bpd
--on b.bill_id = bpd.bill_id
--and bpd.bill_payment_id = 0
left join bill_fee_assoc bfa with(nolock)
    on bfa.bill_id = b.bill_id
left join fee f with(nolock)
    on f.fee_id = bfa.fee_id
left join situs s with (nolock)
	on b.prop_id = s.prop_id
where b.effective_due_date >= @begin_date
and b.effective_due_date <= @end_date
group by b.prop_id, b.display_year, b.statement_id,a.file_as_name,
ad.addr_line1, ad.addr_city, ad.addr_state, ad.addr_zip, s.situs_num, 
s.situs_street, s.situs_city, s.situs_state, s.situs_zip,p.geo_id
having sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid,0))) > 0
order by b.prop_id, b.display_year

GO

