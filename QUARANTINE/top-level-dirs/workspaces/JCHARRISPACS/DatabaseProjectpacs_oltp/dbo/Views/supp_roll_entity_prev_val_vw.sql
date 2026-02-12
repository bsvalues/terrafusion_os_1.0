


CREATE VIEW dbo.supp_roll_entity_prev_val_vw
AS
SELECT prop_owner_entity_val.taxable_val, 
    prop_owner_entity_val.assessed_val, 
    prop_owner_entity_val.entity_id, supp_roll_info.sup_group_id, 
    supp_roll_info.prop_id, supp_roll_info.owner_id, 
    supp_roll_info.sup_num, supp_roll_info.sup_yr, 
    supp_roll_info.pct_ownership, 
    property_val.prop_inactive_dt
FROM prop_owner_entity_val RIGHT OUTER JOIN
    property_val ON 
    prop_owner_entity_val.prop_id = property_val.prop_id AND 
    prop_owner_entity_val.sup_num = property_val.sup_num AND 
    prop_owner_entity_val.sup_yr = property_val.prop_val_yr RIGHT
     OUTER JOIN
    supp_roll_info ON 
    prop_owner_entity_val.sup_num = supp_roll_info.prev_sup_num
     AND 
    prop_owner_entity_val.prop_id = supp_roll_info.prop_id AND 
    prop_owner_entity_val.owner_id = supp_roll_info.owner_id AND
     prop_owner_entity_val.sup_yr = supp_roll_info.sup_yr

GO

