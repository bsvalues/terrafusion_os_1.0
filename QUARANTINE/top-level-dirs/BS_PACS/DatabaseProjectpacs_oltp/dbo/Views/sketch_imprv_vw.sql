

CREATE VIEW dbo.sketch_imprv_vw
AS
SELECT property_val.prop_id, property_val.prop_val_yr, 
    property_val.sup_num, imprv_detail.imprv_det_class_cd, 
    imprv_detail.imprv_det_meth_cd, 
    imprv_detail.imprv_det_type_cd, imprv_detail.sketch_area, 
    imprv_detail.sketch_cmds, imprv_detail.imprv_det_area_type, 
    imprv_detail.imprv_id, imprv_detail.imprv_det_id, 
    imprv.imprv_type_cd, imprv.imprv_sl_locked, 
    imprv.primary_imprv, imprv.imprv_state_cd, 
    imprv.imprv_homesite, imprv.imprv_desc, imprv.imprv_val, 
    imprv.misc_cd, imprv.imp_new_yr, imprv.imp_new_val, 
    imprv.imp_new_val_override, imprv.original_val, 
    imprv_detail.imprv_det_desc, property.prop_type_cd, 
    property.geo_id, property_val.legal_desc, 
    imprv_detail.can_close_sketch
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    imprv_detail INNER JOIN
    imprv ON imprv_detail.prop_id = imprv.prop_id AND 
    imprv_detail.prop_val_yr = imprv.prop_val_yr AND 
    imprv_detail.imprv_id = imprv.imprv_id AND 
    imprv_detail.sup_num = imprv.sup_num AND 
    imprv_detail.sale_id = imprv.sale_id ON 
    prop_supp_assoc.prop_id = imprv.prop_id AND 
    prop_supp_assoc.owner_tax_yr = imprv.prop_val_yr AND 
    prop_supp_assoc.sup_num = imprv.sup_num INNER JOIN
    property ON property_val.prop_id = property.prop_id
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    (imprv_detail.sale_id = 0) AND 
    (imprv_detail.sketch_cmds IS NOT NULL)

GO

