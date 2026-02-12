


CREATE VIEW dbo.bill_adj_trans_vw
AS
SELECT     dbo.bill_adj_trans.bill_id, dbo.bill_adj_trans.adjust_id, dbo.bill_adj_trans.sup_num, 
                      dbo.bill_adj_trans.curr_mno_tax + dbo.bill_adj_trans.curr_ins_tax AS curr_tax, 
                      dbo.bill_adj_trans.prev_mno_tax + dbo.bill_adj_trans.prev_ins_tax AS prev_tax, (dbo.bill_adj_trans.curr_mno_tax + dbo.bill_adj_trans.curr_ins_tax) 
                      - (dbo.bill_adj_trans.prev_mno_tax + dbo.bill_adj_trans.prev_ins_tax) AS adj_amt, dbo.bill_adj_trans.curr_taxable, dbo.bill_adj_trans.prev_taxable, 
                      dbo.bill_adj_trans.curr_assessed, dbo.bill_adj_trans.prev_assessed, dbo.bill_adj_trans.curr_eff_due_dt, dbo.bill_adj_trans.prev_eff_due_dt, 
                      dbo.bill_adj_trans.curr_mno_tax, dbo.bill_adj_trans.curr_ins_tax, dbo.bill_adj_trans.prev_mno_tax, dbo.bill_adj_trans.prev_ins_tax, 
                      dbo.pacs_user.pacs_user_name, dbo.bill_adj_trans.override_mno, dbo.bill_adj_trans.override_ins, dbo.bill_adj_trans.modify_dt, 
                      dbo.bill_adj_trans.modify_cd, dbo.bill_adj_trans.modify_option, dbo.bill_adj_trans.modify_reason, dbo.bill_adj_trans.modify_by_id, 
                      dbo.supp.sup_type_desc AS modify_desc, dbo.bill.prop_id, dbo.entity.entity_cd, dbo.bill.entity_id, dbo.bill_adj_trans.sup_tax_yr, 
                      dbo.bill_adj_trans.curr_adj_code, dbo.bill_adj_trans.prev_adj_code, pacs_user1.pacs_user_name AS qbill_created_by_user, 
                      pacs_user2.pacs_user_name AS qbill_removed_by_user, dbo.bill_adj_trans.curr_qbill, dbo.bill_adj_trans.prev_pay_type, 
                      dbo.bill_adj_trans.curr_pay_type
FROM         dbo.bill_adj_trans INNER JOIN
                      dbo.bill ON dbo.bill_adj_trans.bill_id = dbo.bill.bill_id INNER JOIN
                      dbo.entity ON dbo.bill.entity_id = dbo.entity.entity_id LEFT OUTER JOIN
                      dbo.pacs_user ON dbo.bill_adj_trans.modify_by_id = dbo.pacs_user.pacs_user_id LEFT OUTER JOIN
                      dbo.pacs_user pacs_user2 ON dbo.bill_adj_trans.curr_qbill_removed_by = pacs_user2.pacs_user_id LEFT OUTER JOIN
                      dbo.pacs_user pacs_user1 ON dbo.bill_adj_trans.curr_qbill_created_by = pacs_user1.pacs_user_id LEFT OUTER JOIN
                      dbo.supp ON dbo.bill_adj_trans.modify_cd = dbo.supp.sup_type_cd

GO

