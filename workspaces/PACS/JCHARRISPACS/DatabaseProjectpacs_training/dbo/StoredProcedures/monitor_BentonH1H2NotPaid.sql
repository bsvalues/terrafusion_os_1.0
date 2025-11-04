


CREATE PROCEDURE [dbo].[monitor_BentonH1H2NotPaid]

@year numeric (4,0)

as

SET NOCOUNT ON


select distinct p.col_owner_id, a.file_as_name, 
sum((bpd.amount_due - bpd.amount_paid)
+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) H1_base_due,
sum((bpd1.amount_due - bpd1.amount_paid)
+ (isnull(fpd1.amount_due, 0) - isnull(fpd1.amount_paid, 0))) H2_base_due,
sum((bpd.amount_due - bpd.amount_paid)
+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) +
sum((bpd1.amount_due - bpd1.amount_paid)
+ (isnull(fpd1.amount_due, 0) - isnull(fpd1.amount_paid, 0))) as base_due,
ad.addr_line1,ad.addr_line2,ad.addr_line3,
ad.addr_city,ad.addr_state,ad.addr_zip, ad.country_cd
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
join account a with (nolock)
on p.col_owner_id = a.acct_id
left join address ad with (nolock)
on p.col_owner_id = ad.acct_id
and ad.primary_addr = 'Y'
left outer join bill_payments_due bpd1 with(nolock)
on b.bill_id = bpd1.bill_id
and bpd1.bill_payment_id = 1
left join fee_payments_due fpd1 with(nolock)
on fpd1.fee_id = f.fee_id
and fpd1.fee_payment_id = 1
where b.is_active = 1
and b.display_year = 2019
and ad.primary_addr = 'Y'
group by p.prop_id, p.geo_id, b.code, pga.prop_group_cd, a.file_as_name,ad.addr_line1,ad.addr_line2,ad.addr_line3,
ad.addr_city,ad.addr_state,ad.addr_zip,p.col_owner_id, a.file_as_name, ad.country_cd
having sum((bpd.amount_due - bpd.amount_paid)
+ (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) > 0

GO

