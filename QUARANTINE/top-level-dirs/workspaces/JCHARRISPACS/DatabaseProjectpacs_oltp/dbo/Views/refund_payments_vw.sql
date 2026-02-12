
create view refund_payments_vw as

select distinct refund.refund_id, payment.payment_id, payment.amount_paid,
  payment.post_date, isnull(ref_number, '') as check_number
from refund

inner join refund_transaction_assoc rta
on refund.refund_id = rta.refund_id
and rta.voided = 0

inner join coll_transaction refund_trans
on refund_trans.transaction_id = rta.transaction_id

inner join coll_transaction payment_trans
on payment_trans.trans_group_id = refund_trans.trans_group_id

inner join payment_transaction_assoc pta
on pta.transaction_id = payment_trans.transaction_id
and pta.voided = 0

inner join payment
on payment.payment_id = pta.payment_id

left join tender
on tender.payment_id = payment.payment_id
and tender_id =
  (select top 1 tender_id from tender
   where tender.payment_id = payment.payment_id
   and tender_type_cd = 'CK')

GO

