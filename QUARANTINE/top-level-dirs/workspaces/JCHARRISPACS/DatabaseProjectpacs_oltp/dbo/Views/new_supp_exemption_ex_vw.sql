




CREATE VIEW dbo.new_supp_exemption_ex_vw
AS
SELECT property_exemption.owner_tax_yr, 
    SUM(property_entity_exemption.state_amt + property_entity_exemption.local_amt)
     AS exmpt_amt, property_entity_exemption.entity_id, 
    COUNT(property_exemption.prop_id) AS exmpt_count, 
    property_exemption.effective_tax_yr, 
    property_exemption.sup_num
FROM property_exemption INNER JOIN
    property_entity_exemption ON 
    property_exemption.prop_id = property_entity_exemption.prop_id
     AND 
    property_exemption.owner_id = property_entity_exemption.owner_id
     AND 
    property_exemption.exmpt_tax_yr = property_entity_exemption.exmpt_tax_yr
     AND 
    property_exemption.owner_tax_yr = property_entity_exemption.owner_tax_yr
     AND 
    property_exemption.exmpt_type_cd = property_entity_exemption.exmpt_type_cd
     INNER JOIN
    property_val ON 
    property_exemption.prop_id = property_val.prop_id AND 
    property_exemption.exmpt_tax_yr = property_val.prop_val_yr AND
     property_exemption.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL
WHERE (property_exemption.exmpt_type_cd = 'EX') OR
    (property_exemption.exmpt_type_cd = 'EX366')
GROUP BY property_exemption.owner_tax_yr, 
    property_entity_exemption.entity_id, 
    property_exemption.effective_tax_yr, 
    property_exemption.sup_num

GO

