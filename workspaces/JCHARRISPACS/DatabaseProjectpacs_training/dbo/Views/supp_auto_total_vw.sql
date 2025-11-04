


CREATE VIEW dbo.supp_auto_total_vw
AS
SELECT COUNT(property.prop_id) AS prop_count, 
    property.prop_type_cd, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS appraised_val, 
    entity_prop_assoc.entity_id, property_val.sup_num, 
    property_val.prop_val_yr AS owner_tax_yr
FROM property_val INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num INNER JOIN
    owner ON property_val.prop_id = owner.prop_id AND 
    property_val.prop_val_yr = owner.owner_tax_yr AND 
    property_val.sup_num = owner.sup_num
WHERE (property.prop_type_cd = 'A') AND 
    (property_val.prop_inactive_dt IS NULL)
GROUP BY property.prop_type_cd, entity_prop_assoc.entity_id, 
    property_val.sup_num, property_val.prop_val_yr

GO

