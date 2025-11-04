





---here is how you set up the monitor call:  {Call ExciseDetail ('1/1/2017', '1/31/2017')}    

/*  

This monitor was created for Benton to mimic the excise detail report but to include all payments
related to REET in a given month including voids.

*/

CREATE procedure [dbo].[monitor_batchbreakdowntender]          


@begin_date  datetime,
@end_date datetime          

as          

set nocount on          

select distinct ba.batch_id, ba.user_id, ba.description,ba.balance_dt, sum(t.amount) amount_paid,t.tender_type_cd
from payment pta with (Nolock)
join batch ba with (Nolock)
on ba.batch_id = pta.batch_id
join tender t
on pta.payment_id = t.payment_id
where ba.balance_dt > = @begin_date
and ba.balance_dt < = @end_date
group by t.tender_type_cd, ba.batch_id, ba.user_id, ba.description,t.tender_type_cd,  ba.balance_dt
order by ba.batch_id


set nocount off

GO

