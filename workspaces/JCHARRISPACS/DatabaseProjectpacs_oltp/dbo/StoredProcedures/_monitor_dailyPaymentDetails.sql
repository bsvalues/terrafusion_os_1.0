

 

CREATE procedure [dbo].[_monitor_dailyPaymentDetails]

 

@begin_date datetime,
@end_date datetime

 

as

SET NOCOUNT ON

 
select distinct p.batch_id, ba.description, ba.balance_dt, t.tender_type_cd, les.paid, ka.voided, cus.net_paid
from payment p
join tender t
on p.payment_id = t.payment_id
join batch ba
on p.batch_id = ba.batch_id

join (select tender_type_cd, ba.batch_id, sum(amount_paid) as net_paid
 from payment p
 join tender t
 on p.payment_id = t.payment_id
 join batch ba
 on p.batch_id = ba.batch_id
 where ba.balance_dt >= @begin_date
 and ba.balance_dt <= @end_date
 group by t.tender_type_cd, ba.batch_id) cus
 on t.tender_type_cd = cus.tender_type_cd
 and cus.batch_id = ba.batch_id

 join (select tender_type_cd, ba.batch_id, sum(amount_paid) as paid
 from payment p
 join tender t
 on p.payment_id = t.payment_id
 join batch ba
 on p.batch_id = ba.batch_id
 where ba.balance_dt >= @begin_date
 and ba.balance_dt <= @end_date
 and p.payment_code <> 'VP'
 group by t.tender_type_cd, ba.batch_id) les
 on t.tender_type_cd = les.tender_type_cd
 and les.batch_id = ba.batch_id

left join (select tender_type_cd, ba.batch_id, sum(amount_paid) as voided
 from payment p
 join tender t
 on p.payment_id = t.payment_id
 join batch ba
 on p.batch_id = ba.batch_id
 where ba.balance_dt >= @begin_date
 and ba.balance_dt <= @end_date
 and p.payment_code = 'VP'
 group by t.tender_type_cd, ba.batch_id) ka
 on t.tender_type_cd = ka.tender_type_cd
 and ka.batch_id = ba.batch_id

where ba.close_dt is not NULL
and ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
group by p.batch_id, ba.description, ba.balance_dt, t.tender_type_cd, p.payment_code, p.payment_id, cus.net_paid, ka.voided, les.paid
order by p.batch_id, t.tender_type_cd

GO

