




CREATE VIEW dbo.new_supp_pers_prop_val
AS
SELECT pers_prop_seg.prop_val_yr, 
    SUM(pers_prop_seg.pp_new_val) AS pp_new_val, 
    pers_prop_seg.pp_new_val_yr, 
    COUNT(DISTINCT entity_prop_assoc.prop_id) AS prop_count, 
    entity_prop_assoc.sup_num, 
    entity_prop_assoc.entity_id
FROM pers_prop_seg INNER JOIN
    entity_prop_assoc ON 
    pers_prop_seg.prop_id = entity_prop_assoc.prop_id AND 
    pers_prop_seg.prop_val_yr = entity_prop_assoc.tax_yr AND 
    pers_prop_seg.sup_num = entity_prop_assoc.sup_num INNER JOIN
    property_val ON 
    pers_prop_seg.prop_id = property_val.prop_id AND 
    pers_prop_seg.prop_val_yr = property_val.prop_val_yr AND 
    pers_prop_seg.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL
WHERE (pers_prop_seg.sale_id = 0)
GROUP BY pers_prop_seg.prop_val_yr, 
    pers_prop_seg.pp_new_val_yr, entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num

GO

