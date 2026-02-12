

CREATE VIEW tax_cert_entity_vw
AS
SELECT fee_tax_cert_assoc.tax_cert_num, fee_tax_cert_assoc.fee_id, 
    fee_tax_cert_assoc.prop_id, fee_prop_entity_assoc.entity_id, 
    entity.entity_cd, account.file_as_name, 
    fee_prop_entity_assoc.entity_amt
FROM account INNER JOIN
    entity ON account.acct_id = entity.entity_id INNER JOIN
    fee_prop_entity_assoc ON 
    entity.entity_id = fee_prop_entity_assoc.entity_id INNER JOIN
    fee_tax_cert_assoc ON 
    fee_prop_entity_assoc.fee_id = fee_tax_cert_assoc.fee_id AND 
    fee_prop_entity_assoc.prop_id = fee_tax_cert_assoc.prop_id
WHERE (fee_prop_entity_assoc.bill_entity_flag = 'F') OR
    (fee_prop_entity_assoc.bill_entity_flag IS NULL)

GO

