





CREATE procedure [dbo].[Monitor_RevitalizationAreaPayments_Kennewick]

@begin_date		datetime,
@end_date		datetime


as


select distinct b.prop_id, p.geo_id, b.display_year, pmt.batch_id, pmt.description, 
pmt.balance_dt, pmt.payment_id, 
	case when pmt.pmt_count = 1 and pmt.due_id = 0 then 'H1 Paid'
		when pmt.pmt_count = 1 and pmt.due_id = 1 then 'H2 Paid'
		when pmt.pmt_count = 2 then 'Full Paid'
		end as Payment,
	pmt.tax_district_cd, 
	pmt.tax_district_desc,
	pmt.levy_cd,
	pmt.levy_description,
	pmt.base_pd
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join prop_group_assoc pga with(nolock)
	on pga.prop_id = b.prop_id
join (select ct.trans_group_id, pmt.payment_id, ct.batch_id, ba.description, ba.balance_dt, 
	max(pta.payment_due_id) due_id, count(pta.payment_due_id) pmt_count, sum(base_amount_pd) base_pd,
	td.tax_district_cd, td.tax_district_desc,
			l.levy_cd, l.levy_description
			from coll_transaction ct with(nolock)
			join batch ba with(nolock)
				on ba.batch_id = ct.batch_id
			join payment_transaction_assoc pta with(nolock)
				on pta.transaction_id = ct.transaction_id
			join payment pmt with(nolock)
				on pmt.payment_id = pta.payment_id
			join levy_bill lb with(nolock)
				on lb.bill_id = ct.trans_group_id
				and lb.tax_district_id in (506, 529, 519,502)
				and lb.levy_cd not in ('CNYHMNSVCS', 'CNYVET', 'CNYVETR', 'CNYHMSVCJ', 'PTKENADR', 'CNYADMR', 'KENNHOSPR')
				--and lb.levy_cd in ('KENADR', 'KENFIREPEN')
			join tax_district td with(nolock)
				on td.tax_district_id = lb.tax_district_id
			Join levy l with(nolock)
				on l.year = lb.year
				and l.levy_cd = lb.levy_cd
				and l.tax_district_id = lb.tax_district_id
			where ba.balance_dt >= @begin_date
			and ba.balance_dt <= @end_date
			and pmt.voided = 0
			and pmt.orig_payment_id is NULL
			group by ct.trans_group_id, pmt.payment_id, ct.batch_id, ba.description, ba.balance_dt, td.tax_district_cd, td.tax_district_desc,
			l.levy_cd, l.levy_description) as pmt
	on pmt.trans_group_id = b.bill_id
where pga.prop_group_cd = 'KENN'
order by b.prop_id, pmt.payment_id



select distinct levy_cd from levy 
order by levy_cd

GO

