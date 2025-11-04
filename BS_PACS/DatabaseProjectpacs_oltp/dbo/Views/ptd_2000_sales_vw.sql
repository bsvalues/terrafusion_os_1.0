

CREATE VIEW dbo.ptd_2000_sales_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, property.prop_type_cd, 
    property.geo_id, property_val.appraised_val, entity.entity_cd, 
    imprv.imprv_state_cd, land_detail.state_cd, 
    pers_prop_seg.pp_state_cd
FROM entity INNER JOIN
    entity_prop_assoc ON 
    entity.entity_id = entity_prop_assoc.entity_id INNER JOIN
    property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    property ON property_val.prop_id = property.prop_id ON 
    entity_prop_assoc.prop_id = property_val.prop_id AND 
    entity_prop_assoc.sup_num = property_val.sup_num AND 
    entity_prop_assoc.tax_yr = property_val.prop_val_yr LEFT OUTER
     JOIN
    pers_prop_seg ON 
    property_val.prop_id = pers_prop_seg.prop_id AND 
    property_val.prop_val_yr = pers_prop_seg.prop_val_yr AND 
    property_val.sup_num = pers_prop_seg.sup_num LEFT OUTER JOIN
    land_detail ON 
    property_val.prop_id = land_detail.prop_id AND 
    property_val.prop_val_yr = land_detail.prop_val_yr AND 
    property_val.sup_num = land_detail.sup_num LEFT OUTER JOIN
    imprv ON property_val.prop_id = imprv.prop_id AND 
    property_val.prop_val_yr = imprv.prop_val_yr AND 
    property_val.sup_num = imprv.sup_num
WHERE (property.prop_type_cd = 'R' OR
    property.prop_type_cd = 'P') AND 
    (prop_supp_assoc.owner_tax_yr = 2000) AND 
    (entity.entity_cd = 'SC') AND 
    (property_val.appraised_val > 7191) AND 
    (property_val.appraised_val < 126470) AND 
    (imprv.imprv_state_cd LIKE 'A%')

GO

