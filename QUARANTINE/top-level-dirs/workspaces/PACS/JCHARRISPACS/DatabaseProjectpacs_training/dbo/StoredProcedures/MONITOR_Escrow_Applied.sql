

CREATE procedure [dbo].[MONITOR_Escrow_Applied]

/****

This monitor will provide a list of all escrow applied to taxes for a specified date range.

{CALL MONITOR_Escrow_Applied ('4/13/2017', '4/13/2017')}

****/

@begin_date		date,
@end_date		date

as 



select e.prop_id, p.geo_id, e.comment, 
	pmt.payment_id, pmt.batch_id, ba.balance_dt, ba.description, pmt.voided, 
	sum(base_amount_pd) amount_applied
from escrow e with(nolock)
join coll_transaction ct with(nolock)
	on ct.trans_group_id = e.escrow_id
join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
join payment pmt with(nolock)
	on pmt.payment_id = pta.payment_id
join batch ba with(nolock)
	on ba.batch_id = pmt.batch_id
join property p with(nolock)
	on p.prop_id = e.prop_id
where ct.transaction_type = 'AE'
and ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by e.prop_id, p.geo_id, e.comment, pmt.payment_id, pmt.batch_id, ba.balance_dt, ba.description, pmt.voided

GO

