



CREATE VIEW dbo.prop_total_vw
AS
SELECT prop_supp_assoc.owner_tax_yr, 
    entity_prop_assoc.entity_id, 
    COUNT(entity_prop_assoc.prop_id) AS prop_count, 
    SUM(property_val.ten_percent_cap * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS ten_percent_cap, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS appraised_val, 
    SUM(property_val.assessed_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS assessed_val
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    owner ON 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY prop_supp_assoc.owner_tax_yr, 
    entity_prop_assoc.entity_id

GO

