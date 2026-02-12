


CREATE VIEW dbo.levy_entity_yr_taxable_vw
AS
SELECT prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr, 
    SUM(prop_owner_entity_val.taxable_val) AS taxable_val, 
    SUM(prop_owner_entity_val.assessed_val) AS assessed_val, 
    SUM(prop_owner_entity_val.weed_taxable_acres) 
    AS taxable_acres, levy_supp_assoc.type
FROM prop_owner_entity_val INNER JOIN
    levy_supp_assoc ON 
    prop_owner_entity_val.prop_id = levy_supp_assoc.prop_id AND
     prop_owner_entity_val.sup_num = levy_supp_assoc.sup_num AND
     prop_owner_entity_val.sup_yr = levy_supp_assoc.sup_yr INNER
     JOIN
    property_val ON 
    levy_supp_assoc.prop_id = property_val.prop_id AND 
    levy_supp_assoc.sup_yr = property_val.prop_val_yr AND 
    levy_supp_assoc.sup_num = property_val.sup_num
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    (levy_supp_assoc.type = 'L')
GROUP BY prop_owner_entity_val.entity_id, 
    prop_owner_entity_val.sup_yr, 
    levy_supp_assoc.type

GO

