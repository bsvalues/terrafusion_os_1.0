






---here is how you set up the monitor call:  {Call monitor_escrowpdbydate ('1/1/2017', '1/31/2017')}    

/*  

This monitor was created for Benton to mimic the excise detail report but to include all payments
related to REET in a given month including voids.

*/

CREATE procedure [dbo].[monitor_escrowpdbydate]          


@begin_date  datetime,
@end_date datetime          

as          

set nocount on          

select p.prop_id, ac.file_as_name, e.escrow_id, sum (ct.base_amount_pd) escrow_paid
from escrow e with (Nolock)
join coll_transaction ct with (Nolock)
on ct.trans_group_id = e.escrow_id
join property p 
on e.prop_id = p.prop_id
join account ac
on p.col_owner_id = ac.acct_id
where ct.transaction_date >= @begin_date
and ct.transaction_date <= @end_date
group by p.prop_id, ac.file_as_name, e.escrow_id
having sum (ct.base_amount_pd) > 0
order by p.prop_id

GO

