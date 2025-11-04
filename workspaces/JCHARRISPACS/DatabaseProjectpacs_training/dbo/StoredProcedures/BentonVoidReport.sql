

create procedure [dbo].[BentonVoidReport]   

 @begin_date	datetime,
 @end_date		datetime

 

  

as  



SET NOCOUNT ON



select ba.description, ba.balance_dt, 
	case when transaction_type = 'VOIDR' then 'Refund'
		else 'Payment' end as type,
	case when transaction_type = 'VOIDR' then refund_id
		else payment_id end as ID,
	sum(base_amount_pd + interest_amount_pd + penalty_amount_pd + overage_amount_pd + other_amount_pd) as amount,
	pu.pacs_user_name, pu.full_name
from coll_transaction ct with(nolock)
join batch ba with(nolock)
	on ba.batch_id = ct.batch_id
left join payment_transaction_assoc pta with(nolock)
	on pta.transaction_id = ct.transaction_id
left join refund_transaction_assoc rta with(nolock)
	on rta.transaction_id = ct.transaction_id  
join pacs_user pu with(nolock)
	on pu.pacs_user_id = ct.pacs_user_id
where ba.balance_dt >= @begin_date
and ba.balance_dt <= @end_date
and transaction_type like 'void%'
group by ba.description, ba.balance_dt, ct.transaction_type, refund_id, payment_id,pu.pacs_user_name, pu.full_name

GO

