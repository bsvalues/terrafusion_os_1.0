



create view  installment_agreement_bill_vw

as

select
	installment_agreement_bill_assoc.ia_id, 
	installment_agreement_bill_assoc.bill_id, 
	installment_agreement_bill.sup_tax_yr, 
	installment_agreement_bill.sup_num, 
	installment_agreement_bill.entity_id, 
	installment_agreement_bill.prop_id, 
	installment_agreement_bill.owner_id, 
	installment_agreement_bill.adjustment_code, 
	installment_agreement_bill.adj_effective_dt, 
	installment_agreement_bill.adj_expiration_dt, 
	installment_agreement_bill.adj_comment, 
	installment_agreement_bill.rollback_id, 
	installment_agreement_bill.coll_status_cd, 
	installment_agreement_bill.bill_type, 
	installment_agreement_bill.effective_due_dt, 
	installment_agreement_bill.bill_m_n_o, 
	installment_agreement_bill.bill_i_n_s, 
	installment_agreement_bill.bill_prot_i_n_s, 
	installment_agreement_bill.bill_late_ag_penalty, 
	installment_agreement_bill.bill_m_n_o_pd, 
	installment_agreement_bill.bill_i_n_s_pd, 
	installment_agreement_bill.penalty_m_n_o_pd, 
	installment_agreement_bill.penalty_i_n_s_pd, 
	installment_agreement_bill.interest_m_n_o_pd, 
	installment_agreement_bill.interest_i_n_s_pd, 
	installment_agreement_bill.attorney_fees_pd, 
	installment_agreement_bill.bill_assessed_value, 
	installment_agreement_bill.bill_taxable_val, 
	installment_agreement_bill.stmnt_id, 
	installment_agreement_bill.discount_mno_pd, 
	installment_agreement_bill.discount_ins_pd, 
	installment_agreement_bill.prev_bill_id, 
	installment_agreement_bill.new_bill_id, 
	installment_agreement_bill.create_dt, 
	installment_agreement_bill.ref_id1, 
	installment_agreement_bill.ref_id2, 
	installment_agreement_bill.ref_id3, 
	installment_agreement_bill.ref_id4, 
	installment_agreement_bill.ref_id5, 
	installment_agreement_bill.discount_offered, 
	installment_agreement_bill.levy_group_id, 
	installment_agreement_bill.levy_run_id, 
	installment_agreement_bill.active_bill, 
	installment_agreement_bill.q1_amt, 
	installment_agreement_bill.q1_paid, 
	installment_agreement_bill.q1_due_dt, 
	installment_agreement_bill.q2_amt, 
	installment_agreement_bill.q2_paid, 
	installment_agreement_bill.q2_due_dt, 
	installment_agreement_bill.q3_amt, 
	installment_agreement_bill.q3_paid, 
	installment_agreement_bill.q3_due_dt, 
	installment_agreement_bill.q4_amt, 
	installment_agreement_bill.q4_paid, 
	installment_agreement_bill.q4_due_dt, 
	installment_agreement_bill.q_bill, 
	installment_agreement_bill.q_create_dt, 
	installment_agreement_bill.q_remove_dt, 
	installment_agreement_bill.q_created_by, 
	installment_agreement_bill.q_removed_by, 
	installment_agreement_bill.bill_adj_m_n_o, 
	installment_agreement_bill.bill_adj_i_n_s, 
	installment_agreement_bill.refund_m_n_o_pd, 
	installment_agreement_bill.refund_i_n_s_pd, 
	installment_agreement_bill.refund_pen_m_n_o_pd, 
	installment_agreement_bill.refund_pen_i_n_s_pd, 
	installment_agreement_bill.refund_int_m_n_o_pd, 
	installment_agreement_bill.refund_int_i_n_s_pd, 
	installment_agreement_bill.refund_atty_fee_pd, 
	installment_agreement_bill.underage_mno_pd, 
	installment_agreement_bill.underage_ins_pd, 
	installment_agreement_bill.overage_mno_pd, 
	installment_agreement_bill.overage_ins_pd, 
	installment_agreement_bill.refund_disc_mno_pd, 
	installment_agreement_bill.refund_disc_ins_pd, 
	installment_agreement_bill.refund_underage_mno_pd,
	installment_agreement_bill.refund_underage_ins_pd,
	installment_agreement_bill.refund_overage_mno_pd,
	installment_agreement_bill.refund_overage_ins_pd,
	account.file_as_name,
	entity.entity_cd
from
	installment_agreement_bill with (nolock)
inner join
	installment_agreement_bill_assoc with (nolock)
on
	installment_agreement_bill_assoc.bill_id = installment_agreement_bill.bill_id
inner join
	account with (nolock)
on
	account.acct_id = installment_agreement_bill.owner_id
inner join
	entity with (nolock)
on
	entity.entity_id = installment_agreement_bill.entity_id

GO

