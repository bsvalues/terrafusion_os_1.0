


CREATE VIEW dbo.property_supp_entity_vw
AS
SELECT DISTINCT 
    prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num, entity_prop_assoc.entity_id, 
    entity_prop_assoc.entity_prop_id, 
    entity_prop_assoc.entity_prop_pct, 
    entity_prop_assoc.annex_yr, entity.entity_cd, 
    entity.entity_type_cd, property_val.sup_cd, 
    property_val.sup_dt, property_val.sup_desc, 
    property_val.sup_action
FROM prop_supp_assoc INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    entity ON 
    entity_prop_assoc.entity_id = entity.entity_id INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num

GO

