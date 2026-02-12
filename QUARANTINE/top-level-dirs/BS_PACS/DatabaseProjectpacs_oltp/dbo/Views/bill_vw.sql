

create view bill_vw

as

select
	bill.prop_id, 
	bill.bill_id, 
	bill.sup_tax_yr, 
	bill.sup_num, 
	bill.owner_id, 
	property.col_owner_id, 
	bill.entity_id, 
	entity_account.file_as_name as entity_desc, 
	bill.adjustment_code, 
	bill.coll_status_cd, 
	bill.bill_type, 
	bill.effective_due_dt, 
	bill.bill_m_n_o, 
	bill.bill_i_n_s, 
	bill.bill_i_n_s_pd, 
	bill.penalty_m_n_o_pd, 
	bill.penalty_i_n_s_pd, 
	bill.interest_m_n_o_pd, 
	bill.interest_i_n_s_pd, 
	bill.attorney_fees_pd, 
	bill.bill_assessed_value, 
	bill.bill_taxable_val, 
	bill.stmnt_id, 
	bill.discount_ins_pd, 
	bill.discount_mno_pd, 
	bill.new_bill_id, 
	bill.prev_bill_id, 
	bill.bill_m_n_o_pd, 
	property.ref_id1, 
	property.ref_id2, 
	property.geo_id, 
	property.dba_name, 
	property.alt_dba_name, 
	situs.primary_situs, 
	situs.situs_num, 
	situs.situs_street_prefx, 
	situs.situs_street, 
	situs.situs_street_sufix, 
	situs.situs_city, 
	situs.situs_state, 
	situs.situs_zip, 
	account.first_name, 
	account.last_name, 
	account.file_as_name, 
	entity.entity_cd, 
	bill.bill_prot_i_n_s, 
	bill.create_dt, 
	bill.ref_id1 as bill_ref_id1, 
	bill.ref_id2 as bill_ref_id2, 
	bill.ref_id4 as bill_ref_id3, 
	bill.ref_id3 as bill_ref_id4, 
	bill.adj_effective_dt, 
	bill.adj_expiration_dt, 
	bill.adj_comment, 
	bill.rollback_id, 
	bill.active_bill, 
	bill.bill_adj_m_n_o, 
	bill.bill_adj_i_n_s, 
	bill.refund_m_n_o_pd, 
	bill.refund_i_n_s_pd, 
	bill.refund_pen_m_n_o_pd, 
	bill.refund_pen_i_n_s_pd, 
	bill.refund_int_m_n_o_pd, 
	bill.refund_atty_fee_pd, 
	bill.refund_int_i_n_s_pd, 
	bill.underage_mno_pd, 
	bill.underage_ins_pd, 
	bill.overage_mno_pd, 
	bill.overage_ins_pd, 
	bill.refund_disc_mno_pd, 
	bill.refund_disc_ins_pd,
	bill.refund_underage_mno_pd,
	bill.refund_underage_ins_pd,
	bill.refund_overage_mno_pd,
	bill.refund_overage_ins_pd,
	account.confidential_file_as_name, 
	account.confidential_first_name, 
	account.confidential_last_name, 
	isnull(bill.ia_id, 0) as ia_id, 
	bill.pay_type, 
	bill.pay1_amt, 
	bill.pay1_paid, 
	bill.pay1_due_dt, 
	bill.pay2_amt, 
	bill.pay2_paid, 
	bill.pay2_due_dt, 
	bill.pay3_amt, 
	bill.pay3_paid, 
	bill.pay3_due_dt, 
	bill.pay4_amt, 
	bill.pay4_paid, 
	bill.pay4_due_dt, 
	bill.pay_created_dt, 
	bill.pay_removed_dt, 
	bill.pay_created_by, 
	bill.pay_removed_by,
	bill.bill_late_ag_penalty
from
	bill with (nolock)
inner join
	property with (nolock)
on
	property.prop_id = bill.prop_id
inner join
	account with (nolock)
on
	account.acct_id = bill.owner_id
inner join
	account as entity_account with (nolock)
on
	entity_account.acct_id = bill.entity_id
inner join
	entity with (nolock)
on
	entity.entity_id = bill.entity_id
left outer join
	situs with (nolock)
on
	situs.prop_id = bill.prop_id
and	situs.primary_situs = 'Y'

GO

