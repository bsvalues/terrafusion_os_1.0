




CREATE VIEW dbo.levy_entity_yr_vw
AS
SELECT DISTINCT 
    levy_supp_assoc.type, levy_supp_assoc.sup_yr, 
    entity.entity_id
FROM levy_supp_assoc, entity

GO

