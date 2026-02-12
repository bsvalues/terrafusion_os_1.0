



CREATE VIEW dbo.transfer_entity_vw
AS
SELECT entity.entity_cd, entity.entity_type_cd, 
    account.file_as_name, prop_owner_entity_val.prop_id, 
    prop_owner_entity_val.owner_id, 
    prop_owner_entity_val.sup_num, 
    prop_owner_entity_val.sup_yr, 
    prop_owner_entity_val.taxable_val, 
    prop_owner_entity_val.assessed_val, 
    prop_owner_entity_val.entity_id, 
    entity_prop_assoc.entity_prop_pct
FROM entity INNER JOIN
    account ON entity.entity_id = account.acct_id INNER JOIN
    prop_owner_entity_val ON 
    entity.entity_id = prop_owner_entity_val.entity_id INNER JOIN
    entity_prop_assoc ON 
    prop_owner_entity_val.entity_id = entity_prop_assoc.entity_id AND
     prop_owner_entity_val.prop_id = entity_prop_assoc.prop_id AND
     prop_owner_entity_val.sup_num = entity_prop_assoc.sup_num
     AND 
    prop_owner_entity_val.sup_yr = entity_prop_assoc.tax_yr INNER
     JOIN
    property_val ON 
    entity_prop_assoc.prop_id = property_val.prop_id AND 
    entity_prop_assoc.tax_yr = property_val.prop_val_yr AND 
    entity_prop_assoc.sup_num = property_val.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)

GO

