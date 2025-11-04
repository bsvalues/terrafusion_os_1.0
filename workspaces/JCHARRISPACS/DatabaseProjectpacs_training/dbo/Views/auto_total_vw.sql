



CREATE VIEW dbo.auto_total_vw
AS
SELECT COUNT(property.prop_id) AS prop_count, 
    prop_supp_assoc.owner_tax_yr, property.prop_type_cd, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS appraised_val, 
    entity_prop_assoc.entity_id
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property ON 
    prop_supp_assoc.prop_id = property.prop_id INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.sup_num = entity_prop_assoc.sup_num AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr INNER
     JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (property.prop_type_cd = 'A') AND 
    (property_val.prop_inactive_dt IS NULL)
GROUP BY property.prop_type_cd, 
    prop_supp_assoc.owner_tax_yr, entity_prop_assoc.entity_id

GO

