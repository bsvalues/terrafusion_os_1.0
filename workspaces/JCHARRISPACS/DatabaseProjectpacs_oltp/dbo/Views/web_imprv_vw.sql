







CREATE VIEW dbo.web_imprv_vw
AS
SELECT imprv.imprv_id, imprv.sale_id, imprv.imprv_type_cd, 
    imprv_type.imprv_type_desc, imprv.imprv_state_cd, 
    imprv.imprv_val, ISNULL(web_imprv_ma_vw.base_unit_price, 
    0) AS base_unit_price, 
    ISNULL(web_imprv_ma_sketch_area_vw.sketch_sqft, 0) 
    + ISNULL(web_imprv_ma_calc_area_vw.calc_sqft, 0) 
    AS ma_sqft, imprv.imprv_desc, prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num AS Expr1
FROM imprv INNER JOIN
    prop_supp_assoc ON 
    imprv.prop_id = prop_supp_assoc.prop_id AND 
    imprv.prop_val_yr = prop_supp_assoc.owner_tax_yr AND 
    imprv.sup_num = prop_supp_assoc.sup_num LEFT OUTER JOIN
    web_imprv_ma_sketch_area_vw ON 
    imprv.prop_id = web_imprv_ma_sketch_area_vw.prop_id AND 
    imprv.prop_val_yr = web_imprv_ma_sketch_area_vw.prop_val_yr
     AND 
    imprv.imprv_id = web_imprv_ma_sketch_area_vw.imprv_id AND
     imprv.sup_num = web_imprv_ma_sketch_area_vw.sup_num LEFT
     OUTER JOIN
    web_imprv_ma_calc_area_vw ON 
    imprv.prop_id = web_imprv_ma_calc_area_vw.prop_id AND 
    imprv.prop_val_yr = web_imprv_ma_calc_area_vw.prop_val_yr AND
     imprv.imprv_id = web_imprv_ma_calc_area_vw.imprv_id AND 
    imprv.sup_num = web_imprv_ma_calc_area_vw.sup_num LEFT OUTER
     JOIN
    imprv_type ON 
    imprv.imprv_type_cd = imprv_type.imprv_type_cd LEFT OUTER JOIN
    web_imprv_ma_vw ON 
    imprv.prop_id = web_imprv_ma_vw.prop_id AND 
    imprv.prop_val_yr = web_imprv_ma_vw.prop_val_yr AND 
    imprv.imprv_id = web_imprv_ma_vw.imprv_id AND 
    imprv.sup_num = web_imprv_ma_vw.sup_num
WHERE (imprv.sale_id = 0)

GO

