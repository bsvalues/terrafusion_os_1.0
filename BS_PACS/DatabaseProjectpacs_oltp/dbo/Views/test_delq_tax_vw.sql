




CREATE VIEW dbo.test_delq_tax_vw
AS
SELECT bill.entity_id, bill.prop_id, bill.owner_id, bill.bill_m_n_o, 
    bill.bill_i_n_s, bill.bill_m_n_o_pd, bill.bill_i_n_s_pd, 
    bill.sup_tax_yr, bill.adjustment_code, bill.adj_effective_dt, 
    bill.adj_expiration_dt, bill.effective_due_dt, 
    bill.bill_taxable_val, bill.bill_assessed_value, bill.stmnt_id, 
    entity.entity_cd, bill.coll_status_cd, bill.discount_mno_pd, 
    bill.discount_ins_pd, bill.bill_id, account.file_as_name, 
    address.primary_addr, address.addr_line1, 
    address.addr_line2, address.addr_line3, address.addr_city, 
    address.addr_state, address.country_cd, address.addr_zip, 
    address.ml_deliverable, property.prop_type_cd, 
    property.prop_create_dt
FROM address INNER JOIN
    account ON address.acct_id = account.acct_id INNER JOIN
    bill INNER JOIN
    entity ON bill.entity_id = entity.entity_id ON 
    account.acct_id = bill.owner_id INNER JOIN
    property ON bill.prop_id = property.prop_id
WHERE (bill.coll_status_cd <> 'RS') AND 
    (address.primary_addr = 'Y')

GO

