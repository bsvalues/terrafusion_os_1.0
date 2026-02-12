
---here is how you set up the monitor call:  {Call monitor_Payments ('1/1/2017', '1/31/2017')}    

     



CREATE procedure [dbo].monitor_Payments          



          



          



@begin_date  datetime,

@end_date datetime          



          



        



as          



             



set nocount on     

select p.payment_id, p.batch_id, ba.balance_dt, p.amount_paid
from payment p with(nolock)
join batch ba with(Nolock)
	on ba.batch_id = p.batch_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date

GO

