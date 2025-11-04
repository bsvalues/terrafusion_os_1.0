




create view property_refund_transaction_vw
as
select
	bill.prop_id,
	bill.bill_id,
	refund.refund_id,
	refund_trans.transaction_id,
	refund.batch_id,
	refund.date_refunded,
	refund.payment_method,
	account.file_as_name,
	bill.entity_id,
	bill.sup_tax_yr,
	entity.entity_cd,
	bill.stmnt_id,
	pacs_user.pacs_user_name,
	refund.refund_amt,
	refund.payee_id,
	refund.operator_id,
	refund.check_num,
	refund_trans.refund_m_n_o_pd,
	refund_trans.refund_i_n_s_pd,
	refund_trans.refund_pen_m_n_o_pd,
	refund_trans.refund_pen_i_n_s_pd,
	refund_trans.refund_int_m_n_o_pd,
	refund_trans.refund_int_i_n_s_pd,
	refund_trans.refund_atty_fee_pd,
	refund_trans.refund_disc_mno_pd,
	refund_trans.refund_disc_ins_pd,
	refund_trans.refund_underage_mno_pd,
	refund_trans.refund_underage_ins_pd,
	refund_trans.refund_overage_mno_pd,
	refund_trans.refund_overage_ins_pd,
	(
		refund_trans.refund_m_n_o_pd
	+	refund_trans.refund_i_n_s_pd
	+	refund_trans.refund_pen_m_n_o_pd
	+	refund_trans.refund_pen_i_n_s_pd
	+	refund_trans.refund_int_m_n_o_pd
	+	refund_trans.refund_int_i_n_s_pd
	+	refund_trans.refund_atty_fee_pd
	+	refund_trans.refund_overage_mno_pd
	+	refund_trans.refund_overage_ins_pd
	) as refund_due_amt,
	(
		refund_trans.refund_m_n_o_pd
	+	refund_trans.refund_i_n_s_pd
	+	refund_trans.refund_pen_m_n_o_pd
	+	refund_trans.refund_pen_i_n_s_pd
	+	refund_trans.refund_int_m_n_o_pd
	+	refund_trans.refund_int_i_n_s_pd
	+	refund_trans.refund_atty_fee_pd
	+	refund_trans.refund_disc_mno_pd
	+	refund_trans.refund_disc_ins_pd
	+	refund_trans.refund_underage_mno_pd
	+	refund_trans.refund_underage_ins_pd
	+	refund_trans.refund_overage_mno_pd
	+	refund_trans.refund_overage_ins_pd
	) as refund_trans_amt
from
	refund with (nolock)
inner join
	refund_trans with (nolock)
on
	refund_trans.refund_id = refund.refund_id
inner join
	bill with (nolock)
on
	bill.bill_id = refund_trans.bill_id
inner join
	entity with (nolock)
on
	entity.entity_id = bill.entity_id
inner join
	pacs_user with (nolock)
on
	pacs_user.pacs_user_id = refund.operator_id
left outer join
	account with (nolock)
on
	account.acct_id = refund.payee_id

GO

