




CREATE VIEW dbo.entity_certify_tax_rate_vw
AS
SELECT entity.entity_id, pacs_system.appr_yr, entity.entity_cd, 
    tax_rate.ready_to_certify, tax_rate.appraise_for, entity.rendition_entity
FROM entity LEFT OUTER JOIN
    tax_rate ON 
    entity.entity_id = tax_rate.entity_id RIGHT OUTER JOIN
    pacs_system ON tax_rate.tax_rate_yr = pacs_system.appr_yr

GO

