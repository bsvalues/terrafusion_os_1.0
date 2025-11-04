



CREATE VIEW transfer_delq_tax_vw
AS
SELECT     dbo.bill.entity_id, dbo.bill.prop_id, dbo.bill.owner_id, dbo.bill.bill_m_n_o, dbo.bill.bill_i_n_s, dbo.bill.bill_m_n_o_pd, dbo.bill.bill_i_n_s_pd, 
                      dbo.bill.sup_tax_yr, dbo.bill.adjustment_code, dbo.bill.adj_effective_dt, dbo.bill.adj_expiration_dt, dbo.bill.effective_due_dt, dbo.bill.bill_taxable_val, 
                      dbo.bill.bill_assessed_value, dbo.bill.stmnt_id, dbo.entity.entity_cd, dbo.bill.coll_status_cd, dbo.bill.discount_mno_pd, dbo.bill.discount_ins_pd, 
                      dbo.bill.bill_id, dbo.account.file_as_name, dbo.address.primary_addr, dbo.address.addr_line1, dbo.address.addr_line2, dbo.address.addr_line3, 
                      dbo.address.addr_city, dbo.address.addr_state, dbo.address.country_cd, dbo.address.addr_zip, dbo.address.ml_deliverable, 
                      dbo.DELQ_PROP_INFO_VW.legal_desc, dbo.DELQ_PROP_INFO_VW.prop_type_cd, dbo.DELQ_PROP_INFO_VW.geo_id, 
                      dbo.DELQ_FREEZE_INFO_VW.freeze_yr, dbo.DELQ_FREEZE_INFO_VW.freeze_ceiling, dbo.bill.bill_adj_m_n_o, dbo.bill.bill_adj_i_n_s, 
                      dbo.bill.refund_i_n_s_pd, dbo.bill.refund_m_n_o_pd, dbo.bill.underage_mno_pd, dbo.bill.underage_ins_pd, dbo.bill.refund_disc_mno_pd, 
                      dbo.bill.refund_disc_ins_pd
FROM         dbo.address INNER JOIN
                      dbo.account ON dbo.address.acct_id = dbo.account.acct_id AND dbo.address.primary_addr = 'Y' INNER JOIN
                      dbo.bill INNER JOIN
                      dbo.entity ON dbo.bill.entity_id = dbo.entity.entity_id ON dbo.account.acct_id = dbo.bill.owner_id LEFT OUTER JOIN
                      dbo.DELQ_PROP_INFO_VW ON dbo.bill.prop_id = dbo.DELQ_PROP_INFO_VW.prop_id LEFT OUTER JOIN
                      dbo.DELQ_FREEZE_INFO_VW ON dbo.bill.prop_id = dbo.DELQ_FREEZE_INFO_VW.prop_id AND 
                      dbo.bill.owner_id = dbo.DELQ_FREEZE_INFO_VW.owner_id
WHERE     (dbo.bill.coll_status_cd <> 'RS') AND (dbo.bill.active_bill = 'T' OR
                      dbo.bill.active_bill IS NULL) AND (dbo.bill.prop_id > 0)

GO

