




CREATE PROCEDURE DeleteSupGroupBills 
   @input_sup_group	int
AS

/* delete all the bills associated with the supplement group */
update bill set bill_adj_m_n_o = IsNull(bill_adj_trans.prev_mno_tax, 0),
		bill_adj_i_n_s = IsNull(bill_adj_trans.prev_ins_tax, 0),
		bill_taxable_val = IsNull(prev_taxable, 0),
		bill_assessed_value = IsNull(prev_assessed, 0),
		effective_due_dt = prev_eff_due_dt,
		adjustment_code = prev_adj_code,
		sup_num = bill_adj_trans.prev_sup_num
from bill_adj_trans, property_val as pv
where bill.bill_id 		= bill_adj_trans.bill_id
and   bill_adj_trans.sup_group_id   = @input_sup_group
and   pv.prop_id = bill.prop_id 
and   pv.prop_val_yr = bill.sup_tax_yr 
and   pv.sup_num = bill.sup_num
and   pv.accept_create_id is null

delete recap_trans from recap_trans 
inner join bill_adj_trans on
recap_trans.bill_id = bill_adj_trans.bill_id and
recap_trans.ref_id1 = bill_adj_trans.adjust_id and 
bill_adj_trans.sup_group_id = @input_sup_group 
inner join bill on
bill_adj_trans.bill_id = bill.bill_id and
bill_adj_trans.prev_sup_num = bill.sup_num

delete refund_due_trans from refund_due_trans 
inner join bill_adj_trans on 
bill_adj_trans.bill_id = refund_due_trans.bill_id
and bill_adj_trans.adjust_id = refund_due_trans.adjust_id
inner join bill on
bill_adj_trans.bill_id = bill.bill_id and
bill_adj_trans.prev_sup_num = bill.sup_num
where bill_adj_trans.sup_group_id   = @input_sup_group

delete bill_adj_trans from bill_adj_trans
inner join bill on
bill_adj_trans.bill_id = bill.bill_id and
bill_adj_trans.prev_sup_num = bill.sup_num
where bill_adj_trans.sup_group_id   = @input_sup_group

/* update the sup_group as being accepted, but not as having bills created */
update sup_group
set   status_cd = 'A', sup_bill_create_dt = NULL
where sup_group_id = @input_sup_group

exec SupGroupResetTables @input_sup_group, 1

GO

