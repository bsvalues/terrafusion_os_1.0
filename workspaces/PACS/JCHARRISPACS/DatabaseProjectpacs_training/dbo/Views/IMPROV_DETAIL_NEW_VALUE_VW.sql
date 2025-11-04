

CREATE VIEW dbo.IMPROV_DETAIL_NEW_VALUE_VW
AS
SELECT imprv_detail.prop_id, imprv_detail.prop_val_yr, 
    imprv_detail.imprv_id, imprv_detail.sup_num, 
    imprv_detail.sale_id, SUM(imprv_detail.new_value) 
    AS new_value_total, imprv.imp_new_val_override, 
    imprv.imp_new_val, imprv_detail.new_value_flag
FROM imprv_detail INNER JOIN
    imprv ON imprv_detail.prop_id = imprv.prop_id AND 
    imprv_detail.prop_val_yr = imprv.prop_val_yr AND 
    imprv_detail.imprv_id = imprv.imprv_id AND 
    imprv_detail.sup_num = imprv.sup_num AND 
    imprv_detail.sale_id = imprv.sale_id
GROUP BY imprv_detail.prop_val_yr, imprv_detail.prop_id, 
    imprv_detail.imprv_id, imprv_detail.sup_num, 
    imprv_detail.sale_id, imprv.imp_new_val_override, 
    imprv.imp_new_val, imprv_detail.new_value_flag

GO

