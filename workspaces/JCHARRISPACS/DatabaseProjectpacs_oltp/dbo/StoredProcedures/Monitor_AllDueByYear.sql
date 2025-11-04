
 
CREATE procedure [dbo].[Monitor_AllDueByYear]
 
@display_year int 

as
 
SET NOCOUNT ON


select DISTINCT p.prop_type_cd, p.prop_id, p.geo_id, p.col_owner_id, b.display_year,
--sum (b.initial_amount_due) as orig_bill_base, 
--sum (b.current_amount_due) as curr_bill_base,
--sum (b.current_amount_due - b.amount_paid) as remaining_bill_base_due,
--sum (f.initial_amount_due) as fee_orig_amnt_due,
--sum (f.current_amount_due) as fee_curr_due, 
sum((b.current_amount_due - b.amount_paid) +
(isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) total_current_tax_due_W_Fees
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
where b.display_year = @display_year ------------------Display Year
group by p.prop_type_cd,  p.prop_id, p.geo_id,p.col_owner_id, b.display_year
having sum((b.current_amount_due - b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) > 0.00

GO

