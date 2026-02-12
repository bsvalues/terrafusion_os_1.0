





















---here is how you set up the monitor call:  {Call monitor_REETInfo2 ('1/1/2017', '1/31/2017')}    







/*  







This monitor was created for Benton to mimic the excise detail report but to include all payments



related to REET in a given month including voids.







*/







Create procedure [dbo].[monitor_miscreceiptpmtinfo]          






@begin_date		datetime








as          





select p.payment_id, pu.pacs_user_name cashier, f.current_amount_due, f.amount_paid, t.tender_type_cd, t.ref_number, t.amount,
p.payee_name
from coll_transaction ct with(nolock)
join payment_transaction_assoc pta with(nolock)
on pta.transaction_id = ct.transaction_id
join payment p with(nolock)
on p.payment_id = pta.payment_id
join pacs_user pu with(nolock)
on pu.pacs_user_id = p.pacs_user_id
join tender t with(nolock)
on t.payment_id = p.payment_id
join fee f with(nolock)
on f.fee_id = ct.trans_group_id
join batch ba with(nolock)
on ba.batch_id = ct.batch_id
where ba.balance_dt = @begin_date
and f.fee_type_cd = 'MISC RCPT'
order by p.payment_id

GO

