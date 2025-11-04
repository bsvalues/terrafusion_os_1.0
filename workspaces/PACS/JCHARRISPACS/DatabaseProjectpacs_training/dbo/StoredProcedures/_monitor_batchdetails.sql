
 

CREATE procedure [dbo].[_monitor_batchdetails]

 

@begin_date datetime,
@end_date datetime

 

as

SET NOCOUNT ON


select ct.batch_id, ba.balance_dt, ba.close_dt, ba.create_dt,
      pu.pacs_user_name, ba.description, 
      sum(ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd
            + ct.bond_interest_pd - underage_amount_pd + overage_amount_pd
			+ other_amount_pd) total_paid,
	COUNT (distinct pta.payment_id) payment_count
from coll_transaction ct with(nolock) join batch ba with(nolock)
      on ba.batch_id = ct.batch_id
join pacs_user pu with(nolock)
      on pu.pacs_user_id = ba.user_id
join payment_transaction_assoc pta
	on ct.transaction_id = pta.transaction_id
where ba.balance_dt >= @begin_date 
and ba.balance_dt <= @end_date 
group by ct.batch_id, ba.balance_dt, ba.close_dt, ba.create_dt,
      pu.pacs_user_name, ba.description
order by ct.batch_id

GO

