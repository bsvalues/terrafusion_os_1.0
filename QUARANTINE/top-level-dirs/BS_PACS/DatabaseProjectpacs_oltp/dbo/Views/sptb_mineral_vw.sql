


CREATE VIEW dbo.sptb_mineral_vw
AS
SELECT entity_prop_assoc.entity_id, property_val.prop_val_yr, 
    property.state_cd, 
    SUM(property_val.assessed_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS mineral_val
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    property ON 
    prop_supp_assoc.prop_id = property.prop_id INNER JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    (property.prop_type_cd = 'MN')
GROUP BY entity_prop_assoc.entity_id, property_val.prop_val_yr, 
    property.state_cd

GO

