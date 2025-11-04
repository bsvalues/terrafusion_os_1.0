





CREATE VIEW dbo.transfer_appraisal_entity_taxable_total_vw
AS
SELECT SUM(taxable_val) AS entity_taxable_val, entity_id
FROM transfer_appraisal_entity_info
GROUP BY entity_id

GO

