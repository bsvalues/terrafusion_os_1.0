
CREATE procedure [dbo].[MONITOR_FeeMonitor]
  
@begin_date		datetime,
@end_date		datetime
  
as  
  

SET NOCOUNT ON   


select f.fee_type_cd, ft.fee_type_desc, f.fee_id, f.display_year, ct.transaction_type, sum(ct.base_amount) original_fee_amt
into #created_fees
from coll_transaction ct with(nolock)
join fee f with(nolock)
on f.fee_id = ct.trans_group_id
join monitor_treasurer_om_fees t
on t.fee_type_cd = f.fee_type_cd
join fee_type ft with(nolock)
on ft.fee_type_cd = t.fee_type_cd
join batch ba with(nolock)
on ba.batch_id = ct.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and ct.transaction_type = 'CF'
group by f.fee_type_cd, ft.fee_type_desc, f.fee_id, f.display_year, ct.transaction_type


select t.fee_type_cd, t.fee_type_desc, t.fee_id, t.display_year, ct.transaction_type, sum(ct.base_amount) adjusted_fee_amt
into #adjusted_fees
from #created_fees t
join coll_transaction ct with(nolock)
on ct.trans_group_id = t.fee_id
join batch ba with(nolock)
on ba.batch_id = ct.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and ct.transaction_type = 'ADJF'
group by t.fee_type_cd, t.fee_type_desc, t.fee_id, t.display_year, ct.transaction_type


select t.fee_type_cd, t.fee_type_desc, t.fee_id, t.display_year, 'paid_fees' as action, sum(ct.base_amount_pd) fee_pd
into #paid_fees
from #created_fees t
join coll_transaction ct with(nolock)
on ct.trans_group_id = t.fee_id
join transaction_type tt with(nolock)
on tt.transaction_type = ct.transaction_type
join batch ba with(nolock)
on ba.batch_id = ct.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and tt.core_transaction_type in (2, 4)
group by t.fee_type_cd, t.fee_type_desc, t.fee_id, t.display_year


select c.fee_type_cd, c.display_year, sum(c.original_fee_amt) original_fee_amt,
sum(isnull(a.adjusted_fee_amt, 0)) adjusted_fee_amt,
sum(isnull(p.fee_pd, 0)) fee_amt_pd,
sum(c.original_fee_amt + isnull(a.adjusted_fee_amt, 0) - isnull(p.fee_pd, 0)) as fee_base_due
from #created_fees c 
left join #adjusted_fees a
on a.fee_id = c.fee_id
left join #paid_fees p 
on p.fee_id = c.fee_id
group by c.fee_type_cd, c.display_year
order by c.fee_type_cd, c.display_year

GO

