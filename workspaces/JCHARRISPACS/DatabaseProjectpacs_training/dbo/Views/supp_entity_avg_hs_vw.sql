





CREATE VIEW dbo.supp_entity_avg_hs_vw
AS
SELECT entity_prop_assoc.entity_id, entity_prop_assoc.sup_num, 
    entity_prop_assoc.tax_yr, CONVERT(numeric(14, 0), 
    SUM(property_val.market) 
    / supp_entity_hs_count.prop_ct) AS avg_hstd_val, 
    supp_entity_hs_count.prop_ct
FROM entity_prop_assoc INNER JOIN
    property_val ON 
    entity_prop_assoc.prop_id = property_val.prop_id AND 
    entity_prop_assoc.tax_yr = property_val.prop_val_yr AND 
    entity_prop_assoc.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL AND 
    property_val.market IS NOT NULL INNER JOIN
    supp_entity_hs_count ON 
    entity_prop_assoc.entity_id = supp_entity_hs_count.entity_id AND
     entity_prop_assoc.sup_num = supp_entity_hs_count.sup_num AND
     entity_prop_assoc.tax_yr = supp_entity_hs_count.tax_yr INNER
     JOIN
    prop_w_hs_vw ON 
    property_val.prop_id = prop_w_hs_vw.prop_id AND 
    property_val.prop_val_yr = prop_w_hs_vw.exmpt_tax_yr AND 
    property_val.sup_num = prop_w_hs_vw.sup_num
GROUP BY entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num, entity_prop_assoc.tax_yr, 
    supp_entity_hs_count.prop_ct

GO

