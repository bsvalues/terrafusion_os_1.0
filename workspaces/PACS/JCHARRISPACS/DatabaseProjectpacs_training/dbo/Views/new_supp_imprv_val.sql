




CREATE VIEW dbo.new_supp_imprv_val
AS
SELECT imprv.prop_val_yr, imprv.imp_new_yr, 
    SUM(imprv.imp_new_val) AS imp_new_val, 
    entity_prop_assoc.entity_id, 
    COUNT(DISTINCT entity_prop_assoc.prop_id) AS prop_count, 
    entity_prop_assoc.sup_num
FROM imprv INNER JOIN
    entity_prop_assoc ON 
    imprv.prop_id = entity_prop_assoc.prop_id AND 
    imprv.prop_val_yr = entity_prop_assoc.tax_yr AND 
    imprv.sup_num = entity_prop_assoc.sup_num INNER JOIN
    property_val ON imprv.prop_id = property_val.prop_id AND 
    imprv.prop_val_yr = property_val.prop_val_yr AND 
    imprv.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL
WHERE (imprv.sale_id = 0)
GROUP BY imprv.imp_new_yr, imprv.prop_val_yr, 
    entity_prop_assoc.entity_id, entity_prop_assoc.sup_num

GO

