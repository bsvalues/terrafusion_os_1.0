




CREATE VIEW dbo.entity_group_bill_vw
AS
SELECT DISTINCT 
    entity_tax_statement_group_assoc.entity_id, bill.bill_type, 
    entity.entity_cd, entity_tax_statement_group.group_id, 
    entity_tax_statement_group.group_yr, 
    entity_tax_statement_group.group_desc, bill.sup_tax_yr, 
    bill.sup_num
FROM entity_tax_statement_group_assoc INNER JOIN
    entity ON 
    entity_tax_statement_group_assoc.entity_id = entity.entity_id INNER
     JOIN
    entity_tax_statement_group ON 
    entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id
     LEFT OUTER JOIN
    bill ON 
    entity_tax_statement_group.group_yr = bill.sup_tax_yr AND 
    entity_tax_statement_group_assoc.entity_id = bill.entity_id

GO

