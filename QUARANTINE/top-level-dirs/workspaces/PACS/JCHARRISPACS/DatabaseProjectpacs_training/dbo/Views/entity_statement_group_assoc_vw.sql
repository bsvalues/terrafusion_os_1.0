












CREATE VIEW dbo.entity_statement_group_assoc_vw
AS
SELECT entity_tax_statement_group_assoc.group_id, 
    entity.entity_id, entity.entity_cd, account.file_as_name
FROM entity_tax_statement_group_assoc INNER JOIN
    entity ON 
    entity_tax_statement_group_assoc.entity_id = entity.entity_id INNER
     JOIN
    account ON entity.entity_id = account.acct_id

GO

