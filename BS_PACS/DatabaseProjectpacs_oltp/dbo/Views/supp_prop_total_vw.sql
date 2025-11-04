


CREATE VIEW dbo.supp_prop_total_vw
AS
SELECT entity_prop_assoc.entity_id, 
    COUNT(entity_prop_assoc.prop_id) AS prop_count, 
    SUM(property_val.ten_percent_cap * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS ten_percent_cap, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS appraised_val, 
    SUM(property_val.assessed_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS assessed_val, 
    property_val.prop_val_yr AS owner_tax_yr, 
    property_val.sup_num
FROM property_val INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num INNER JOIN
    owner ON property_val.prop_id = owner.prop_id AND 
    property_val.prop_val_yr = owner.owner_tax_yr AND 
    property_val.sup_num = owner.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY entity_prop_assoc.entity_id, property_val.prop_val_yr, 
    property_val.sup_num

GO

