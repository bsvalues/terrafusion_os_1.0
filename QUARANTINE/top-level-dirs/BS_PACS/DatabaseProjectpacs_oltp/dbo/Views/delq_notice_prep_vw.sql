



CREATE VIEW dbo.delq_notice_prep_vw
AS
SELECT bill.sup_tax_yr, mortgage_assoc.mortgage_co_id, 
    bill.bill_id, bill.coll_status_cd, property.col_owner_id as owner_id, bill.prop_id, 
    bill.entity_id, bill.sup_num, property.prop_type_cd, 
    property.col_agent_id as agent_id, address.ml_deliverable, 
    address.country_cd, bill.adjustment_code
FROM bill 

INNER JOIN property ON 
	bill.prop_id = property.prop_id 

LEFT OUTER JOIN address ON 
	property.col_owner_id = address.acct_id 
AND address.primary_addr = 'Y' 


LEFT OUTER JOIN mortgage_assoc ON 
    bill.prop_id = mortgage_assoc.prop_id

WHERE  (bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) > 0
AND bill.coll_status_cd <> 'RS'
AND bill.prop_id > 0

GO

