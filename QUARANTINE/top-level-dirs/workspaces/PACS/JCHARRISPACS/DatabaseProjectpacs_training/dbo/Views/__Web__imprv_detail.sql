create view __Web__imprv_detail as 
SELECT imprv_detail.imprv_id, imprv_detail.imprv_det_id, 
    imprv_detail.sale_id, imprv_detail.imprv_det_type_cd, 
    imprv_det_type.imprv_det_typ_desc, 
    imprv_det_type.main_area, imprv_detail.imprv_det_desc, 
    imprv_detail.imprv_det_class_cd, imprv_detail.sketch_area, 
    imprv_detail.calc_area, imprv_detail.imprv_det_area_type, 
    imprv_detail.yr_built, imprv_detail.imprv_det_val, 
    prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num
FROM imprv_detail INNER JOIN
    imprv_det_type ON 
    imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd
     INNER JOIN
    prop_supp_assoc ON 
    imprv_detail.prop_id = prop_supp_assoc.prop_id AND 
    imprv_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     imprv_detail.sup_num = prop_supp_assoc.sup_num
WHERE (imprv_detail.sale_id = 0)
and
	prop_supp_assoc.owner_tax_yr=(Select appr_yr from pacs_oltp.dbo.pacs_system)

GO

