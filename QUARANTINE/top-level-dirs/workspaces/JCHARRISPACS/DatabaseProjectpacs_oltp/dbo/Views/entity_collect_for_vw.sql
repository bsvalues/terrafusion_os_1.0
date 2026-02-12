










CREATE VIEW dbo.entity_collect_for_vw
AS
SELECT DISTINCT 
    entity.entity_id, entity.entity_cd, account.file_as_name
FROM entity INNER JOIN
    account ON entity.entity_id = account.acct_id INNER JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id
WHERE tax_rate.collect_option <> 'N'

GO

