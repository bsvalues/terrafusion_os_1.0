create view __Web__imprv_ma as 
SELECT imprv_detail.prop_id, imprv_detail.prop_val_yr, 
    imprv_detail.imprv_id, imprv_detail.sup_num,
    SUM(imprv_detail.unit_price) AS base_unit_price
	
FROM imprv_detail INNER JOIN
    imprv_det_type ON 
    imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd
WHERE (imprv_det_type.main_area = 'T') AND 
    (imprv_detail.sale_id = 0)and

	imprv_detail.prop_val_yr=(Select appr_yr from pacs_oltp.dbo.pacs_system)

	GROUP BY imprv_detail.prop_id, imprv_detail.prop_val_yr, 
    imprv_detail.imprv_id, imprv_detail.sup_num

GO

