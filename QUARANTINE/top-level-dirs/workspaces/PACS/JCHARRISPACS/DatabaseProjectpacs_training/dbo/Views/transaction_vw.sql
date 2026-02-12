


create view transaction_vw
as
select
	payment.payment_id,
	payment.batch_id,
	payment.amt_due,
	payment.check_amt + payment.cash_amt as amt_paid,
	payment.payment_type,
	payment.payment_code,
	payment.rcpt_num,
	payment.payee_id,
	payment.operator_id,
	payment.date_paid,
	payment.post_date,
	payment.dl_number,
	payment.dl_state,
	payment.dl_exp_date,
	payment.check_num,
	payment.void_payment,
	payment.void_date,
	payment.void_by_id,
	payment.void_reason,
	payment_trans.transaction_id,
	payment_trans.payment_id as transaction_payment_id,
	payment_trans.prop_id,
	payment_trans.bill_id,
	payment_trans.fee_id,
	payment_trans.trans_type,
	payment_trans.fee_amt,
	payment_trans.mno_amt,
	payment_trans.ins_amt,
	payment_trans.penalty_mno_amt,
	payment_trans.penalty_ins_amt,
	payment_trans.interest_mno_amt,
	payment_trans.interest_ins_amt,
	payment_trans.attorney_fee_amt,
	payment_trans.penalty,
	payment_trans.interest,
	payment_trans.attorney_fee,
	payment_trans.discount_mno_amt,
	payment_trans.discount_ins_amt,
	payment_trans.mno_due,
	payment_trans.ins_due,
	payment_trans.underage_mno_amt,
	payment_trans.underage_ins_amt,
	payment_trans.overage_mno_amt,
	payment_trans.overage_ins_amt
from
	payment_trans with (nolock)
inner join
	payment with (nolock)
on
	payment.payment_id = payment_trans.payment_id

GO

