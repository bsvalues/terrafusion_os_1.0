



CREATE VIEW dbo.entity_yr_vw
AS
SELECT DISTINCT 
    property_val.prop_val_yr, entity.entity_id, 
    entity.entity_cd
FROM property_val, entity

GO

