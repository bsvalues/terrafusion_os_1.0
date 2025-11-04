

CREATE VIEW dbo.toyce_vw
AS
SELECT property_val.appraised_val, pers_prop_seg.pp_state_cd, 
    land_detail.state_cd, imprv.imprv_state_cd, 
    property_val.prop_id, entity_prop_assoc.entity_id, 
    property_val.prop_val_yr
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.sup_num = prop_supp_assoc.sup_num AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr INNER
     JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num LEFT OUTER
     JOIN
    imprv ON property_val.prop_id = imprv.prop_id AND 
    property_val.prop_val_yr = imprv.prop_val_yr AND 
    property_val.sup_num = imprv.sup_num LEFT OUTER JOIN
    land_detail ON 
    property_val.prop_id = land_detail.prop_id AND 
    property_val.prop_val_yr = land_detail.prop_val_yr AND 
    property_val.sup_num = land_detail.sup_num LEFT OUTER JOIN
    pers_prop_seg ON 
    property_val.prop_id = pers_prop_seg.prop_id AND 
    property_val.prop_val_yr = pers_prop_seg.prop_val_yr AND 
    property_val.sup_num = pers_prop_seg.sup_num
WHERE (pers_prop_seg.pp_state_cd = 'A1') OR
    (land_detail.state_cd = 'A1') OR
    (imprv.imprv_state_cd = 'A1')

GO

