
CREATE VIEW dbo.supp_exemption_total_vw
AS
SELECT COUNT(property_entity_exemption.exmpt_type_cd) 
    AS exmpt_count, property_entity_exemption.exmpt_type_cd, 
    property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    SUM(property_entity_exemption.state_amt) AS state_amt, 
    SUM(property_entity_exemption.local_amt) AS local_amt, 
    SUM(property_entity_exemption.state_amt) 
    + SUM(property_entity_exemption.local_amt) AS total_amt, 
    property_entity_exemption.sup_num
FROM property_val INNER JOIN
    property_entity_exemption ON 
    property_val.prop_id = property_entity_exemption.prop_id AND 
    property_val.prop_val_yr = property_entity_exemption.exmpt_tax_yr
     AND 
    property_val.sup_num = property_entity_exemption.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY property_entity_exemption.exmpt_type_cd, 
    property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    property_entity_exemption.sup_num

GO

