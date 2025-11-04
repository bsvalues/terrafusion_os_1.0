CREATE PROCEDURE monitor_ReceivableSummaryAudit

/*

This monitor was written for Benton to give them an audit check 
for the ending balances of the Receivable Summary report.

{Call monitor_ReceivableSummaryAudit ('12/31/2018', 'FIRE2EMS')

*/

@end_date		datetime,
@levy_cd		varchar(10)

as

set nocount on


select lb.tax_district_id, lb.levy_cd, lb.year, b.display_year, SUM(ct.base_amount - ct.base_amount_pd) base_due
from levy_bill lb with(nolock)
join bill b with(nolock)
	on b.bill_id = lb.bill_id
join coll_transaction ct with(nolock)
	on ct.trans_group_id = b.bill_id
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
	and ba.balance_dt <= @end_date
where b.is_active = 1
and levy_cd = @levy_cd
group by lb.tax_district_id, lb.levy_cd, lb.year, b.display_year
order by lb.tax_district_id, lb.levy_cd, lb.year desc

GO

