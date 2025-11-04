



CREATE VIEW dbo.entity_exempt_total_vw
AS
SELECT property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    SUM(property_entity_exemption.state_amt + property_entity_exemption.local_amt)
     AS exmpt_amt
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    owner ON 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.sup_num = owner.sup_num INNER JOIN
    property_entity_exemption ON 
    owner.prop_id = property_entity_exemption.prop_id AND 
    owner.owner_id = property_entity_exemption.owner_id AND 
    owner.sup_num = property_entity_exemption.sup_num AND 
    owner.owner_tax_yr = property_entity_exemption.exmpt_tax_yr
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id

GO

