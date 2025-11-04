


CREATE VIEW dbo.sptb_mkt_land_vw
AS
SELECT land_detail.state_cd, land_detail.prop_val_yr, 
    SUM(land_detail.land_seg_mkt_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS mkt_land, 
    entity_prop_assoc.entity_id
FROM land_detail INNER JOIN
    prop_supp_assoc ON 
    land_detail.prop_id = prop_supp_assoc.prop_id AND 
    land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr AND 
    land_detail.sup_num = prop_supp_assoc.sup_num INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num AND
     prop_supp_assoc.prop_id = entity_prop_assoc.prop_id INNER JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (land_detail.sale_id = 0) AND 
    (land_detail.ag_apply IS NULL OR
    land_detail.ag_apply = 'F') AND 
    (property_val.prop_inactive_dt IS NULL)
GROUP BY land_detail.state_cd, land_detail.prop_val_yr, 
    entity_prop_assoc.entity_id

GO

