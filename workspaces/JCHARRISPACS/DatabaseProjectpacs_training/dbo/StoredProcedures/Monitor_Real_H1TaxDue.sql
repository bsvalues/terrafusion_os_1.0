 
create procedure [dbo].[Monitor_Real_H1TaxDue]
 
@tax_yr int
 
as
 
SET NOCOUNT ON
 
 
/*
 
create table _h1_props_due
(
prop_id int,
display_year numeric(4),
h1_due numeric(14,2)
)
 
*/
 
delete from _H1_props_due
insert into _H1_props_due
select b.prop_id, b.display_year, sum(bpd.amount_due - bpd.amount_paid) h1_due
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join bill_payments_due bpd with(nolock)
on bpd.bill_id = b.bill_id
and bpd.bill_payment_id = 0
where b.display_year = @tax_yr
and (bpd.amount_due - bpd.amount_paid) > 0
and b.prop_id not in 
(select b.prop_id
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
where b.display_year < @tax_yr
and (b.current_amount_due - b.amount_paid) > 0
group by b.prop_id, b.display_year)
group by b.prop_id, b.display_year
 
 
select * from _H1_props_due

GO

