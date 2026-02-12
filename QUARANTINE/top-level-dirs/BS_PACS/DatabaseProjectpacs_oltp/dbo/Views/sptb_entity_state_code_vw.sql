









CREATE VIEW dbo.sptb_entity_state_code_vw
AS
SELECT state_code.state_cd, entity.entity_cd, tax_rate.entity_id, 
    tax_rate.tax_rate_yr
FROM entity INNER JOIN
    tax_rate ON entity.entity_id = tax_rate.entity_id, state_code

GO

