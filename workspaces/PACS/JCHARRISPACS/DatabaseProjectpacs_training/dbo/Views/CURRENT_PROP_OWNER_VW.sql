
CREATE VIEW dbo.CURRENT_PROP_OWNER_VW
AS
SELECT owner.owner_id, owner.owner_tax_yr, owner.prop_id, 
    owner.updt_dt, owner.pct_ownership, owner.owner_cmnt, 
    owner.over_65_defer, owner.over_65_date, 
    owner.ag_app_filed, owner.apply_pct_exemptions, 
    owner.sup_num, owner.type_of_int, owner.hs_prop, 
    property_val.sup_cd, property_val.sup_desc, 
    property_val.sup_dt, property_val.sup_action, 
    property_val.legal_desc, property_val.prop_inactive_dt, 
    property.prop_create_dt, owner.roll_exemption, 
    owner.roll_entity, owner.roll_state_code,
	  property_val.prop_state 
FROM owner INNER JOIN
    prop_supp_assoc ON 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.sup_num = prop_supp_assoc.sup_num AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property ON prop_supp_assoc.prop_id = property.prop_id AND 
    property_val.prop_id = property.prop_id

GO

