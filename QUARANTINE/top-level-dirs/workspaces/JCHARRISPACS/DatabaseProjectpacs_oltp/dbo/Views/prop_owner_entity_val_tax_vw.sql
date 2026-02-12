
CREATE VIEW dbo.prop_owner_entity_val_tax_vw
AS
SELECT DISTINCT dbo.prop_owner_entity_val.prop_id, 
    dbo.prop_owner_entity_val.owner_id, 
    dbo.prop_owner_entity_val.sup_num, 
    dbo.prop_owner_entity_val.sup_yr, 
    dbo.prop_owner_entity_val.entity_id, dbo.entity.entity_cd, 
    dbo.prop_owner_entity_val.assessed_val, 
    dbo.prop_owner_entity_val.taxable_val, 
    dbo.property_entity_exemption.exmpt_type_cd, 
    dbo.property_entity_exemption.state_amt, 
    dbo.property_entity_exemption.local_amt,
     dbo.fn_GetCalculatedTax(dbo.prop_owner_entity_val.prop_id, 
                                        dbo.prop_owner_entity_val.owner_id, 
				        dbo.prop_owner_entity_val.entity_id,
                                        dbo.prop_owner_entity_val.sup_yr, 
                                        dbo.prop_owner_entity_val.sup_num) as base_tax,
    dbo.prop_owner_entity_val.freeze_ceiling,
    dbo.prop_owner_entity_val.freeze_yr,
    dbo.prop_owner_entity_val.freeze_type
FROM dbo.prop_owner_entity_val INNER JOIN
    dbo.entity ON 
    dbo.prop_owner_entity_val.entity_id = dbo.entity.entity_id  LEFT OUTER
     JOIN
    dbo.property_entity_exemption ON 
    dbo.prop_owner_entity_val.entity_id = dbo.property_entity_exemption.entity_id
     AND 
    dbo.prop_owner_entity_val.sup_yr = dbo.property_entity_exemption.owner_tax_yr
     AND 
    dbo.prop_owner_entity_val.sup_num = dbo.property_entity_exemption.sup_num
     AND 
    dbo.prop_owner_entity_val.owner_id = dbo.property_entity_exemption.owner_id
     AND 
    dbo.prop_owner_entity_val.prop_id = dbo.property_entity_exemption.prop_id
GROUP BY dbo.prop_owner_entity_val.prop_id, 
    dbo.prop_owner_entity_val.owner_id, 
    dbo.prop_owner_entity_val.sup_num, 
    dbo.prop_owner_entity_val.sup_yr, 
    dbo.prop_owner_entity_val.entity_id, dbo.entity.entity_cd, 
    dbo.prop_owner_entity_val.assessed_val, 
    dbo.prop_owner_entity_val.taxable_val, 
    dbo.property_entity_exemption.exmpt_type_cd, 
    dbo.property_entity_exemption.state_amt, 
    dbo.property_entity_exemption.local_amt,
    dbo.prop_owner_entity_val.freeze_ceiling,
    dbo.prop_owner_entity_val.freeze_yr,
    dbo.prop_owner_entity_val.freeze_type

GO

