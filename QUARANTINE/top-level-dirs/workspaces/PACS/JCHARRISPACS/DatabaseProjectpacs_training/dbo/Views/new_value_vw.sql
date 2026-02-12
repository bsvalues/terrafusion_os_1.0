


CREATE VIEW dbo.new_value_vw
AS
SELECT property_owner_entity_state_cd.prop_id,
    property_owner_entity_state_cd.year, account.file_as_name,
    entity.entity_cd, property_val.legal_desc,
    account1.file_as_name AS entity_name, property.geo_id,
    property_owner_entity_state_cd.new_val,
    property_owner_entity_state_cd.state_cd,
    entity.entity_id, isnull(entity.rendition_entity, 0) as rendition_entity
FROM property_val INNER JOIN
    property_owner_entity_state_cd ON
    property_val.prop_id = property_owner_entity_state_cd.prop_id AND
     property_val.prop_val_yr = property_owner_entity_state_cd.year
     AND
    property_val.sup_num = property_owner_entity_state_cd.sup_num
     INNER JOIN
    entity ON
    property_owner_entity_state_cd.entity_id = entity.entity_id INNER
     JOIN
    account ON
    property_owner_entity_state_cd.owner_id = account.acct_id INNER
     JOIN
    property ON
    property_val.prop_id = property.prop_id INNER JOIN
    account account1 ON
    entity.entity_id = account1.acct_id INNER JOIN
    prop_supp_assoc ON
    property_val.prop_id = prop_supp_assoc.prop_id AND
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num
WHERE (property_val.prop_inactive_dt IS NULL) AND
    (property_owner_entity_state_cd.new_val <> 0)

GO

