





CREATE VIEW dbo.new_supp_prop_w_ag_loss_vw
AS
SELECT COUNT(DISTINCT property_val.prop_id) AS prop_count, 
    SUM(property_val.ag_market) AS ag_market, 
    SUM(property_val.ag_use_val) AS ag_productivity, 
    SUM(property_val.ag_loss) AS ag_loss, 
    prop_w_ag_vw.ag_eff_tax_year, property_val.prop_val_yr, 
    entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num
FROM property_val INNER JOIN
    prop_w_ag_vw ON 
    property_val.prop_id = prop_w_ag_vw.prop_id AND 
    property_val.sup_num = prop_w_ag_vw.sup_num AND 
    property_val.prop_val_yr = prop_w_ag_vw.prop_val_yr AND 
    property_val.prop_val_yr = prop_w_ag_vw.ag_eff_tax_year AND
     property_val.prop_inactive_dt IS NULL INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num
GROUP BY prop_w_ag_vw.ag_eff_tax_year, 
    property_val.prop_val_yr, entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num

GO

