

CREATE procedure [dbo].[monitor_ModifiedBillReport_AdminRefund]

@begin_date		datetime,
@end_date		datetime,
@min_year			int


as



select td.tax_district_desc, lb.levy_cd, l.levy_description, b.display_year, sum(base_tax) as 'Current Tax', 
	sum(previous_base_tax) as 'Previous Tax', sum(base_tax - previous_base_tax) 'Adjustment'
from bill b with(nolock)
join levy_bill lb with(nolock)
	on lb.bill_id = b.bill_id
join tax_district td with(nolock)
	on td.tax_district_id = lb.tax_district_id
join levy l with(nolock)
	on l.year = lb.year
	and l.levy_cd = lb.levy_cd
join bill_adjustment badj with(nolock)
	on badj.bill_id = b.bill_id
join batch ba with(nolock)
	on ba.batch_id = badj.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and display_year >= @min_year
group by td.tax_district_desc, lb.levy_cd, l.levy_description, b.display_year
order by td.tax_district_desc, lb.levy_cd, b.display_year

GO

