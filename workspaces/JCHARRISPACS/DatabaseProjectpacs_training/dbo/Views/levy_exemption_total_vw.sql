
CREATE VIEW dbo.levy_exemption_total_vw
AS
SELECT COUNT(property_entity_exemption.exmpt_type_cd) 
    AS exmpt_count, property_entity_exemption.exmpt_type_cd, 
    property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    SUM(property_entity_exemption.state_amt) AS state_amt, 
    SUM(property_entity_exemption.local_amt) AS local_amt, 
    SUM(property_entity_exemption.state_amt) 
    + SUM(property_entity_exemption.local_amt) AS total_amt, 
    levy_supp_assoc.type
FROM property_val INNER JOIN
    property_entity_exemption ON 
    property_val.prop_id = property_entity_exemption.prop_id AND 
    property_val.prop_val_yr = property_entity_exemption.exmpt_tax_yr
     AND 
    property_val.sup_num = property_entity_exemption.sup_num INNER
     JOIN
    levy_supp_assoc ON 
    property_val.prop_id = levy_supp_assoc.prop_id AND 
    property_val.prop_val_yr = levy_supp_assoc.sup_yr AND 
    property_val.sup_num = levy_supp_assoc.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY property_entity_exemption.exmpt_type_cd, 
    property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, levy_supp_assoc.type

GO

