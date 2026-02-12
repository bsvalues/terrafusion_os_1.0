




CREATE VIEW dbo.entity_set_freeze_vw
AS
SELECT property.prop_type_cd, owner.prop_id, owner.owner_id, 
    owner.pct_ownership, owner.apply_pct_exemptions, 
    entity_prop_assoc.entity_prop_pct, property_val.market, 
    property_val.assessed_val, property_val.appraised_val, 
    property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.land_hstd_val, 
    property_val.land_non_hstd_val, 
    property_val.ten_percent_cap, property_val.sup_action, 
    levy_supp_assoc.type
FROM property_val INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.sup_num = entity_prop_assoc.sup_num AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr INNER JOIN
    owner ON property_val.prop_id = owner.prop_id AND 
    property_val.sup_num = owner.sup_num AND 
    property_val.prop_val_yr = owner.owner_tax_yr INNER JOIN
    property INNER JOIN
    levy_supp_assoc ON 
    property.prop_id = levy_supp_assoc.prop_id ON 
    property_val.prop_id = levy_supp_assoc.prop_id AND 
    property_val.prop_val_yr = levy_supp_assoc.sup_yr AND 
    property_val.sup_num = levy_supp_assoc.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)

GO

