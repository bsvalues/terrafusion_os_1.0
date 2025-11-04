

 
CREATE procedure [dbo].[Monitor_H1_DUE_NoBID_PERS]
 
@tax_yr int
 
as
 
SET NOCOUNT ON

select b.prop_id, p.geo_id, b.display_year, b.statement_id, 
sum(bpd.amount_due - bpd.amount_paid) h1_due
from bill b with(nolock)
join property p with(nolock)
on p.prop_id = b.prop_id
join bill_payments_due bpd with(nolock)
on bpd.bill_id = b.bill_id
and bpd.bill_payment_id = 0
where b.display_year = 2024
and (bpd.amount_due - bpd.amount_paid) > 0 
and bpd.bill_payment_id = 0
and p.geo_id like '30P%'
or p.geo_id like '20P%'
and b.prop_id not in (select b2.prop_id
	from bill b2 with (nolock)
	join assessment_bill ab with (nolock)
	on b2.bill_id = ab.bill_id 
	join special_assessment_agency saa with (nolock)
	on ab.agency_id = saa.agency_id 
	where saa.agency_id < >  521
)
group by b.prop_id, p.geo_id, b.display_year, b.statement_id
having sum  (bpd.amount_due - bpd.amount_paid) > 0 
order by p.geo_id

GO

