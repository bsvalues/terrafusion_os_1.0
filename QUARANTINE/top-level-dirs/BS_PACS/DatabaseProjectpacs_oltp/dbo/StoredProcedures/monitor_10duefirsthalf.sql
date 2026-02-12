
CREATE PROCEDURE [dbo].[monitor_10duefirsthalf]

/*************
This monitor was created for Benton to identify REET records on properties with a specified exemption within a specified date range.

{Call monitor_10duefirsthalf(2019)}
*************/

@display_yr	int


as

select distinct p.prop_id,
sum((bpd.amount_due - bpd.amount_paid)
+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) H1_base_due
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join bill_payments_due bpd with(nolock)
on b.bill_id = bpd.bill_id
and bpd.bill_payment_id = 0
and b.payment_status_type_cd = 'HALF'
left join bill_fee_assoc bfa with(nolock)
on bfa.bill_id = b.bill_id
left join prop_group_assoc pga
on b.prop_id = pga.prop_id
left join fee f with(nolock)
on f.fee_id = bfa.fee_id
and f.is_active = 1
and f.payment_status_type_cd = 'HALF'
left join fee_payments_due fpd with(nolock)
on fpd.fee_id = f.fee_id
and fpd.fee_payment_id = 0
where b.is_active = 1
and b.display_year = @display_yr
group by p.prop_id
having sum((bpd.amount_due - bpd.amount_paid)
+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) = 10.00 
--and SUM((bpd.amount_due - bpd.amount_paid)
--+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) > 0  
order by H1_base_due desc

GO

