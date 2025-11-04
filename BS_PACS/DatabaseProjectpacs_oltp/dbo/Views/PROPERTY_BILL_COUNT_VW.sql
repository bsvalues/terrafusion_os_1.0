



CREATE VIEW PROPERTY_BILL_COUNT_VW
AS
select prop_id,
sum((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
	((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
	(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) as base_tax_due,
count(bill.bill_id) as bill_count
from bill
where ( bill.coll_status_cd <> 'RS')
and ( bill.active_bill = 'T' or bill.active_bill is null)
group by prop_id

GO

