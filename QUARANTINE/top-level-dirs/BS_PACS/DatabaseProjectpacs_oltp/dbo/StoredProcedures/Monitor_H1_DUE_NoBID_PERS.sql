


 
CREATE procedure [dbo].[Monitor_H1_DUE_NoBID_PERS]
 
@tax_yr int
 
as
 
SET NOCOUNT ON

select b.prop_id, p.geo_id, p.col_owner_id as owner_id, b.display_year, b.statement_id, 
sum(bpd.amount_due - bpd.amount_paid) h1_due, 
--sum ((bpd.amount_due - bpd.amount_paid)) + (isnull(fpd.amount_due,0)) - (isnull(fpd.amount_paid,0)) as H1_duewithFees,
ac.file_as_name, addr.addr_line1, addr_line2, addr_line3, addr_city, addr_state, addr_zip
from bill b with (nolock)
join property p with (nolock)
	on p.prop_id = b.prop_id
join bill_payments_due bpd with (nolock)
	on bpd.bill_id = b.bill_id
	and bpd.bill_payment_id = 0
left join account ac with (nolock)
	on p.col_owner_id = ac.acct_id
left join address addr with (nolock)
on addr.acct_id = ac.acct_id
and addr.primary_addr = 'Y'
	where b.display_year = @tax_yr
	and (bpd.amount_due - bpd.amount_paid) > 0 
	and bpd.bill_payment_id = 0
	and (p.geo_id like '30P%'
	or p.geo_id like '20P%')
	and b.prop_id not in (select b2.prop_id
							from bill b2 with (nolock)
							join assessment_bill ab with (nolock)
								on b2.bill_id = ab.bill_id 
							join special_assessment_agency saa with (nolock)
								on ab.agency_id = saa.agency_id 
							where saa.agency_id < >  521)

group by b.prop_id,  p.geo_id, p.col_owner_id, b.display_year, b.statement_id,ac.file_as_name, addr.addr_line1, addr_line2, addr_line3, addr_city, addr_state,
addr_zip
having sum  (bpd.amount_due - bpd.amount_paid) > 0 
order by p.geo_id

GO

