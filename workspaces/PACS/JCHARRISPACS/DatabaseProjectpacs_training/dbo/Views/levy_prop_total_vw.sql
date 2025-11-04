




CREATE VIEW dbo.levy_prop_total_vw
AS
SELECT entity_prop_assoc.entity_id, 
    COUNT(entity_prop_assoc.prop_id) AS prop_count, 
    SUM(property_val.ten_percent_cap * entity_prop_assoc.entity_prop_pct
     / 100) AS ten_percent_cap, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100) AS appraised_val, 
    SUM(property_val.assessed_val * entity_prop_assoc.entity_prop_pct
     / 100) AS assessed_val, 
    property_val.prop_val_yr AS owner_tax_yr, 
    levy_supp_assoc.type
FROM property_val INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num INNER JOIN
    levy_supp_assoc ON 
    property_val.prop_id = levy_supp_assoc.prop_id AND 
    property_val.prop_val_yr = levy_supp_assoc.sup_yr AND 
    property_val.sup_num = levy_supp_assoc.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY entity_prop_assoc.entity_id, property_val.prop_val_yr, 
    levy_supp_assoc.type

GO

