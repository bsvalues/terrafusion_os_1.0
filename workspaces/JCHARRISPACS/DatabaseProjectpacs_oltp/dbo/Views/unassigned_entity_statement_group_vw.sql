












CREATE VIEW dbo.unassigned_entity_statement_group_vw
AS
SELECT entity.entity_id, entity.entity_cd, tax_rate.tax_rate_yr, 
    account.file_as_name
FROM entity INNER JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id INNER JOIN
    account ON entity.entity_id = account.acct_id
WHERE (tax_rate.entity_id NOT IN
        (SELECT entity_id
      FROM entity_tax_statement_group_assoc, 
           entity_tax_statement_group
      WHERE entity_tax_statement_group.group_id = entity_tax_statement_group_assoc.group_id
            AND 
           entity_tax_statement_group.group_yr = tax_rate.tax_rate_yr))

GO

