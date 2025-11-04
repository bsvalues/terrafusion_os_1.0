

    



    



    



    



---here is how you set up the monitor call:  {Call monitor_LitigationPayments ('1/1/2017', '1/31/2017', 1)}    



      

/*

This monitor was written for Benton to provide a list of all payments made to properties
associated with a litigation record.  The inputs are beginning date, ending date and litigation ID. 
The dates are inclusive.

*/

          



          



CREATE procedure [dbo].[monitor_H1andFullPayments]          


@begin_date  datetime,

@end_date datetime



as          



         
set nocount on          

select distinct b.prop_id, b.display_year, sum(b.current_amount_due) amount_due, sum(b.amount_paid) amount_paid, payment_status_type_cd, ba.balance_dt
from bill b
join coll_transaction ct
on b.bill_id = ct.trans_group_id
join batch ba
on ct.batch_id = ba.batch_id
join assessment_bill ab
on b.bill_id = ab.bill_id
--order by ba.balance_dt desc
where ba.balance_dt >= @begin_date 
and ba.balance_dt >= @end_date 
and b.amount_paid > 0
group by b.prop_id, b.bill_id, b.current_amount_due, b.amount_paid, payment_status_type_cd, ba.balance_dt, display_year
order by payment_status_type_cd, b.prop_id


set nocount off

GO

