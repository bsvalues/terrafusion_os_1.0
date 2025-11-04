


CREATE procedure [dbo].[monitor_10DuebyYearbyHalf]


@tax_year		numeric (5,0),

@halfpayment	int

as  

SET NOCOUNT ON   

--drop table #bill
--drop table #fee

select b.prop_id, b.display_year, SUM((bpd.amount_due - bpd.amount_paid) + (ISNULL(fpd.amount_due,  0) - ISNULL(fpd.amount_paid, 0))) base_due
into #bill
from bill b with(nolock)
join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b.bill_id
	and bpd.bill_payment_id = @halfpayment
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(Nolock)
	on f.fee_id = bfa.fee_id
left join fee_payments_due fpd with(nolock)
	on fpd.fee_id = f.fee_id
	and fpd.fee_payment_id = @halfpayment
where b.display_year = @tax_year
and ((bpd.amount_due - bpd.amount_paid) + (ISNULL(fpd.amount_due,  0) - ISNULL(fpd.amount_paid, 0))) > 0
group by b.prop_id, b.display_year


select fpa.prop_id, f.display_year, SUM(fpd.amount_due - fpd.amount_paid) base_due
into #fee
from fee f with(nolock)
join fee_payments_due fpd with(nolock)
	on fpd.fee_id = f.fee_id
	and fpd.fee_payment_id = @halfpayment
join fee_prop_assoc fpa with(nolock)
	on fpa.fee_id = f.fee_id
where f.display_year = @tax_year
and (fpd.amount_due - fpd.amount_paid) > 0
group by fpa.prop_id, f.display_year


select p.prop_id, p.geo_id, case when b.display_Year is not NULL then b.display_year else f.display_year end as tax_year,  
	a.file_as_name, ad.addr_line1, ad.addr_line2, ad.addr_line3, ad.addr_city, ad.addr_state, ad.addr_zip,
	(ISNULL(b.base_due, 0) + ISNULL(f.base_due,0)) base_due
from property p with(nolock)
join account a with(nolock)
	on a.acct_id = p.col_owner_id
left join address ad with(nolock)
	on ad.acct_id = a.acct_id
	and ad.primary_addr = 'Y'
left join #bill b 
	on b.prop_id = p.prop_id
left join #fee f 
	on f.prop_id = p.prop_id
where (ISNULL(b.base_due, 0) + ISNULL(f.base_due,0)) = 10
order by file_as_name, case when b.display_Year is not NULL then b.display_year else f.display_year end

GO

