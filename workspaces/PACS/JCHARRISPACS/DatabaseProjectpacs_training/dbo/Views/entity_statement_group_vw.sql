












CREATE VIEW dbo.entity_statement_group_vw
AS
SELECT entity_tax_statement_group.group_id, 
    entity_tax_statement_group.group_yr, 
    entity_tax_statement_group.group_desc, 
    entity_tax_statement_group.assigned_id, 
    entity_tax_statement_group.assigned_date, entity.entity_id, 
    entity.entity_cd
FROM entity INNER JOIN
    entity_tax_statement_group_assoc ON 
    entity.entity_id = entity_tax_statement_group_assoc.entity_id RIGHT
     OUTER JOIN
    entity_tax_statement_group ON 
    entity_tax_statement_group_assoc.group_id = entity_tax_statement_group.group_id

GO

