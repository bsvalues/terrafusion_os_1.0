

CREATE procedure [dbo].[MONITOR_OPC_Applied]

/****

This monitor will provide a list of all overpayment credits applied to taxes for a specified date range.

{CALL MONITOR_OPC_Applied ('4/13/2017', '4/13/2017')}

****/

@begin_date		date,
@end_date		date

as 

select opc.prop_id, p.geo_id, opc.acct_id, a.file_as_name, opc.comment, opc.amount, 
	opc.apply_payment_id, pmt.batch_id, ba.balance_dt, ba.description, pmt.voided, 
	sum(base_amount_pd) amount_applied
from overpayment_credit opc with(nolock)
join coll_transaction ct with(nolock)
	on ct.trans_group_id = opc.overpmt_credit_id
join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
join payment pmt with(nolock)
	on pmt.payment_id = pta.payment_id
join batch ba with(nolock)
	on ba.batch_id = pmt.batch_id
left join property p with(nolock)
	on p.prop_id = opc.prop_id
left join account a with(nolock)
	on a.acct_id = opc.acct_id
where ct.transaction_type = 'AOC'
and ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by opc.prop_id, p.geo_id, opc.acct_id, a.file_as_name, opc.comment, opc.amount, 
	opc.apply_payment_id, pmt.batch_id, ba.balance_dt, ba.description, pmt.voided

GO

