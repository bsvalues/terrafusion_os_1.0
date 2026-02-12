




CREATE VIEW dbo.new_imprv_val
AS
SELECT COUNT(DISTINCT prop_supp_assoc.prop_id) 
    AS prop_count, imprv.prop_val_yr, imprv.imp_new_yr, 
    SUM(imprv.imp_new_val) AS imp_new_val, 
    entity_prop_assoc.entity_id
FROM prop_supp_assoc INNER JOIN
    imprv ON prop_supp_assoc.prop_id = imprv.prop_id AND 
    prop_supp_assoc.owner_tax_yr = imprv.prop_val_yr AND 
    prop_supp_assoc.sup_num = imprv.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL
WHERE (imprv.sale_id = 0)
GROUP BY imprv.imp_new_yr, imprv.prop_val_yr, 
    entity_prop_assoc.entity_id

GO

