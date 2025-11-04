




CREATE VIEW dbo.supp_entity_exempt_total_vw
AS
SELECT property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    SUM(property_entity_exemption.state_amt + property_entity_exemption.local_amt)
     AS exmpt_amt, property_val.sup_num
FROM property_val INNER JOIN
    property_entity_exemption ON 
    property_val.prop_id = property_entity_exemption.prop_id AND 
    property_val.sup_num = property_entity_exemption.sup_num AND
     property_val.prop_val_yr = property_entity_exemption.owner_tax_yr
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, property_val.sup_num

GO

