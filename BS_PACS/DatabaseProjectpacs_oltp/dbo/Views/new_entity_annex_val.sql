




CREATE VIEW dbo.new_entity_annex_val
AS
SELECT entity_prop_assoc.entity_id, entity_prop_assoc.sup_num, 
    entity_prop_assoc.tax_yr, entity_prop_assoc.annex_yr, 
    COUNT(DISTINCT entity_prop_assoc.prop_id) AS prop_count, 
    SUM(prop_owner_entity_val.taxable_val) 
    AS taxable_val
FROM entity_prop_assoc INNER JOIN
    prop_owner_entity_val ON 
    entity_prop_assoc.prop_id = prop_owner_entity_val.prop_id AND
     entity_prop_assoc.sup_num = prop_owner_entity_val.sup_num
     AND 
    entity_prop_assoc.tax_yr = prop_owner_entity_val.sup_yr AND 
    entity_prop_assoc.entity_id = prop_owner_entity_val.entity_id INNER
     JOIN
    property ON 
    entity_prop_assoc.prop_id = property.prop_id INNER JOIN
    property_val ON 
    entity_prop_assoc.prop_id = property_val.prop_id AND 
    entity_prop_assoc.tax_yr = property_val.prop_val_yr AND 
    entity_prop_assoc.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL
WHERE (property.prop_type_cd = 'R') OR
    (property.prop_type_cd = 'P')
GROUP BY entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num, entity_prop_assoc.tax_yr, 
    entity_prop_assoc.annex_yr

GO

