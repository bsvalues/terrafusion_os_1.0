





CREATE VIEW dbo.new_prop_w_tim_loss_vw
AS
SELECT COUNT(DISTINCT property_val.prop_id) AS prop_count, 
    SUM(property_val.ag_market) AS tim_market, 
    SUM(property_val.ag_use_val) AS tim_productivity, 
    SUM(property_val.ag_loss) AS tim_loss, 
    prop_w_tim_vw.ag_eff_tax_year, property_val.prop_val_yr, 
    entity_prop_assoc.entity_id
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num AND 
    property_val.prop_inactive_dt IS NULL INNER JOIN
    prop_w_tim_vw ON 
    prop_supp_assoc.sup_num = prop_w_tim_vw.sup_num AND 
    prop_supp_assoc.prop_id = prop_w_tim_vw.prop_id AND 
    prop_supp_assoc.owner_tax_yr = prop_w_tim_vw.ag_eff_tax_year
     AND 
    prop_supp_assoc.owner_tax_yr = prop_w_tim_vw.prop_val_yr INNER
     JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num
GROUP BY prop_w_tim_vw.ag_eff_tax_year, 
    property_val.prop_val_yr, entity_prop_assoc.entity_id

GO

