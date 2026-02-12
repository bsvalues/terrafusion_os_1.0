




CREATE VIEW dbo.prop_entity_count_vw
AS
SELECT COUNT(prop_id) AS prop_count, entity_id, sup_num, 
    tax_yr
FROM entity_prop_assoc
GROUP BY entity_id, sup_num, tax_yr

GO

