










CREATE VIEW dbo.web_imprv_ma_sketch_area_vw
AS
SELECT imprv_detail.prop_id, imprv_detail.prop_val_yr, 
    imprv_detail.imprv_id, imprv_detail.sup_num, 
    ISNULL(SUM(imprv_detail.sketch_area), 0) 
    AS sketch_sqft
FROM imprv_detail INNER JOIN
    imprv_det_type ON 
    imprv_detail.imprv_det_type_cd = imprv_det_type.imprv_det_type_cd
WHERE (imprv_det_type.main_area = 'T') AND 
    (imprv_detail.sale_id = 0) AND 
    (imprv_detail.imprv_det_area_type = 'S')
GROUP BY imprv_detail.prop_id, imprv_detail.prop_val_yr, 
    imprv_detail.imprv_id, imprv_detail.sup_num

GO

