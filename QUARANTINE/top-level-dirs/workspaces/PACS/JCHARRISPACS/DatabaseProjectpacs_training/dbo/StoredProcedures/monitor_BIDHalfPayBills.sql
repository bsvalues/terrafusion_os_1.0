CREATE PROCEDURE monitor_BIDHalfPayBills

as

select b.prop_id, b.display_year, ab.agency_id, saa.assessment_description, 
	sum(b.current_amount_due - b.amount_paid) base_due, COUNT(*) pmt_count
from bill b with(nolock)
join assessment_bill ab with(nolock)
	on b.bill_id = ab.bill_id
join special_assessment_agency saa with(nolock)
	on saa.agency_id = ab.agency_id
join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b.bill_id
where b.is_active = 1
and ab.agency_id = 521
group by b.prop_id, b.display_year, ab.agency_id, saa.assessment_description
having COUNT(*) > 1
order by display_year desc, prop_id

GO

