



CREATE VIEW dbo.entity_yr_taxable_vw
AS
SELECT prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr, 
    SUM(prop_owner_entity_val.taxable_val) AS taxable_val, 
    SUM(prop_owner_entity_val.assessed_val) AS assessed_val, 
    SUM(prop_owner_entity_val.weed_taxable_acres) 
    AS taxable_acres
FROM prop_owner_entity_val INNER JOIN
    prop_supp_assoc ON 
    prop_owner_entity_val.prop_id = prop_supp_assoc.prop_id AND
     prop_owner_entity_val.sup_num = prop_supp_assoc.sup_num AND
     prop_owner_entity_val.sup_yr = prop_supp_assoc.owner_tax_yr
     INNER JOIN
    property_val ON 
    prop_owner_entity_val.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num
WHERE property_val.prop_inactive_dt IS NULL
GROUP BY prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr

GO

