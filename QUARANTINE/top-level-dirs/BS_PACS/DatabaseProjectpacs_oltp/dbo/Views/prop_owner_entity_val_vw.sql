


CREATE VIEW dbo.prop_owner_entity_val_vw
AS
SELECT prop_owner_entity_val.prop_id, 
    prop_owner_entity_val.owner_id, 
    prop_owner_entity_val.sup_num, 
    prop_owner_entity_val.sup_yr, 
    prop_owner_entity_val.entity_id, entity.entity_cd, 
    prop_owner_entity_val.taxable_val, 
    prop_owner_entity_val.assessed_val, 
    SUM(property_entity_exemption.state_amt) AS state_amt, 
    SUM(property_entity_exemption.local_amt) 
    AS local_amt
FROM entity INNER JOIN
    prop_owner_entity_val ON 
    entity.entity_id = prop_owner_entity_val.entity_id LEFT OUTER JOIN
    property_entity_exemption ON 
    prop_owner_entity_val.entity_id = property_entity_exemption.entity_id
     AND 
    prop_owner_entity_val.sup_yr = property_entity_exemption.exmpt_tax_yr
     AND 
    prop_owner_entity_val.sup_num = property_entity_exemption.sup_num
     AND 
    prop_owner_entity_val.prop_id = property_entity_exemption.prop_id
     AND 
    prop_owner_entity_val.owner_id = property_entity_exemption.owner_id
GROUP BY prop_owner_entity_val.prop_id, 
    prop_owner_entity_val.owner_id, 
    prop_owner_entity_val.sup_num, 
    prop_owner_entity_val.sup_yr, 
    prop_owner_entity_val.entity_id, entity.entity_cd, 
    prop_owner_entity_val.taxable_val, 
    prop_owner_entity_val.assessed_val

GO

