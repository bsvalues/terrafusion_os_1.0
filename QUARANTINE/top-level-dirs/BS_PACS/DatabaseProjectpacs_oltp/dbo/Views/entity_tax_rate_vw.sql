


CREATE VIEW dbo.entity_tax_rate_vw
AS
SELECT entity.entity_id, entity.entity_cd, tax_rate.tax_rate_yr, 
    tax_rate.appraise_for, entity.entity_type_cd, 
    account.file_as_name
FROM entity INNER JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id INNER JOIN
    account ON entity.entity_id = account.acct_id
WHERE (tax_rate.appraise_for = 'T')

GO

