
create view refund_receipt_payments_vw as


-- payments of the items that were refunded
select distinct r.refund_id,p.payment_id,
t.amount,
p.date_paid,
case when isnull(t.credit_amount,0) = 0 then t.ref_number else null end as check_number,
tt.tender_type_desc as credit_tender_type_desc,
case when isnull(t.credit_amount,0) = 0 then 0 else 1 end as has_credit_amount

from refund r with(nolock)

join refund_transaction_assoc rta (nolock)
		on r.refund_id = rta.refund_id

join coll_transaction rct (nolock) 
		on rct.transaction_id = rta.transaction_id

join coll_transaction refund_trans (nolock)
		on rct.trans_group_id = refund_trans.trans_group_id

join payment_transaction_assoc pta (nolock)
		on pta.transaction_id = refund_trans.transaction_id

join payment p (nolock)
		on p.payment_id = pta.payment_id

join tender t
		on t.payment_id = p.payment_id
		and t.amount >= 0

inner join tender_type tt
		on t.tender_type_cd = tt.tender_type_cd

group by 
		r.refund_id,
		r.refund_to_name,
		p.payee_name,
		t.amount,
		p.payment_id,
		t.ref_number,
		t.credit_amount,
		p.date_paid,
		tt.tender_type_desc

UNION


-- payments of escrows that were applied to the refunded items
select r.refund_id, pay_escrow_payment.payment_id, 
case when isnull(t.credit_amount,0) = 0 then t.amount else null end as amount,
case when isnull(t.credit_amount,0) = 0 then pay_escrow_payment.date_paid else null end as date_paid, 
case when isnull(t.credit_amount,0) = 0 then t.ref_number else null end as check_number,
tt.tender_type_desc as credit_tender_type_desc,
case when isnull(t.credit_amount,0) = 0 then 0 else 1 end as has_credit_amount

from refund r with(nolock)

join refund_transaction_assoc rta with(nolock)
on r.refund_id = rta.refund_id
and rta.voided = 0

join coll_transaction refund_trans with(nolock)
on refund_trans.transaction_id = rta.transaction_id

join trans_group refund_tg with(nolock)
on refund_trans.trans_group_id = refund_tg.trans_group_id

join payment_transaction_assoc pta with(nolock)
on pta.transaction_id = isnull(refund_tg.mrtransid_opc, refund_tg.mrtransid_pay)
and pta.voided = 0

join payment apply_escrow_payment with(nolock)
on apply_escrow_payment.payment_id = pta.payment_id

join payment_transaction_assoc apply_escrow_pta with(nolock)
on apply_escrow_pta.payment_id = apply_escrow_payment.payment_id
and apply_escrow_pta.voided = 0

join coll_transaction apply_escrow_trans with(nolock)
on apply_escrow_trans.transaction_id = apply_escrow_pta.transaction_id
and apply_escrow_trans.transaction_type = 'AE'

join escrow with(nolock)
on escrow.escrow_id = apply_escrow_trans.trans_group_id

join coll_transaction pay_escrow_trans with(nolock)
on pay_escrow_trans.trans_group_id = escrow.escrow_id
and pay_escrow_trans.transaction_type = 'PE'

join payment_transaction_assoc pay_escrow_pta with(nolock)
on pay_escrow_pta.transaction_id = pay_escrow_trans.transaction_id
and pay_escrow_pta.voided = 0

join payment pay_escrow_payment with(nolock)
on pay_escrow_payment.payment_id = pay_escrow_pta.payment_id

join tender t with(nolock)
on t.payment_id = pay_escrow_payment.payment_id

join tender_type tt with(nolock)
on t.tender_type_cd = tt.tender_type_cd

GO

