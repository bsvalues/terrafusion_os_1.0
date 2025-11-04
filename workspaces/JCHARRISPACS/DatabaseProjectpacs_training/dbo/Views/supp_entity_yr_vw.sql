




CREATE VIEW dbo.supp_entity_yr_vw
AS
SELECT DISTINCT prop_val_yr, sup_num, entity_id
FROM property_val, entity

GO

