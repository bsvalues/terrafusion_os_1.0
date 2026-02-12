


CREATE procedure [dbo].[Monitor_RevitalizationAreaPayments]

@begin_date		datetime,
@end_date		datetime,
@group_cd		varchar(20)



as

select distinct b.prop_id, p.geo_id, b.display_year, pmt.batch_id, pmt.description, pmt.balance_dt, pmt.payment_id, 
	case when pmt.pmt_count = 1 and pmt.due_id = 0 then 'H1 Paid'
		when pmt.pmt_count = 1 and pmt.due_id = 1 then 'H2 Paid'
		when pmt.pmt_count = 2 then 'Full Paid'
		end as Payment
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join prop_group_assoc pga with(nolock)
	on pga.prop_id = b.prop_id
join (select ct.trans_group_id, pmt.payment_id, ct.batch_id, ba.description, ba.balance_dt, max(pta.payment_due_id) due_id, count(pta.payment_due_id) pmt_count
			from coll_transaction ct with(nolock)
			join batch ba with(nolock)
				on ba.batch_id = ct.batch_id
			join payment_transaction_assoc pta with(nolock)
				on pta.transaction_id = ct.transaction_id
			join payment pmt with(nolock)
				on pmt.payment_id = pta.payment_id
			where ba.balance_dt >= @begin_date
			and ba.balance_dt <= @end_date
			and pmt.voided = 0
			and pmt.orig_payment_id is NULL
			group by ct.trans_group_id, pmt.payment_id, ct.batch_id, ba.description, ba.balance_dt) pmt
	on pmt.trans_group_id = b.bill_id
where pga.prop_group_cd = @group_cd
order by b.prop_id, pmt.payment_id

GO

