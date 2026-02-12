create view __Web_land_detail as 
SELECT  prop_supp_assoc.prop_id,
land_detail.land_seg_id, land_detail.sale_id, 
    land_detail.land_type_cd, land_type.land_type_desc, 
    land_detail.size_acres, land_detail.size_square_feet, 
    land_detail.effective_front, land_detail.effective_depth, 
    land_detail.land_seg_mkt_val, land_detail.ag_val, 
    land_detail.mkt_unit_price, land_sched.ls_code, 
    land_sched.ls_method, 
    prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num
FROM land_detail INNER JOIN
    land_type ON 
    land_detail.land_type_cd = land_type.land_type_cd INNER JOIN
    prop_supp_assoc ON 
    land_detail.prop_id = prop_supp_assoc.prop_id AND 
    land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr AND 
    land_detail.sup_num = prop_supp_assoc.sup_num LEFT OUTER
     JOIN
    land_sched ON 
    land_detail.prop_val_yr = land_sched.ls_year AND 
    land_detail.ls_mkt_id = land_sched.ls_id
WHERE (land_detail.sale_id = 0)and
	prop_supp_assoc.owner_tax_yr=(Select appr_yr from pacs_oltp.dbo.pacs_system)

GO

