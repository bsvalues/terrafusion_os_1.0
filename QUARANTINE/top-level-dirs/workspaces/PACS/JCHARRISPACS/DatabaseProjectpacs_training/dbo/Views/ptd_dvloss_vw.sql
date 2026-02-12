





CREATE VIEW dbo.ptd_dvloss_vw
AS
SELECT COUNT(property_entity_exemption.exmpt_type_cd) 
    AS exmpt_count, "DV" AS exmpt_cd,
    property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id, 
    SUM(property_entity_exemption.state_amt) AS state_amt, 
    SUM(property_entity_exemption.local_amt) AS local_amt, 
    SUM(property_entity_exemption.state_amt) 
    + SUM(property_entity_exemption.local_amt) AS total_amt
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property_entity_exemption ON 
    prop_supp_assoc.prop_id = property_entity_exemption.prop_id AND
     prop_supp_assoc.owner_tax_yr = property_entity_exemption.owner_tax_yr
     AND 
    prop_supp_assoc.sup_num = property_entity_exemption.sup_num
     INNER JOIN
    property ON property.prop_id = property_val.prop_id
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    property_entity_exemption.exmpt_type_cd LIKE 'DV%'
GROUP BY   property_entity_exemption.exmpt_tax_yr, 
    property_entity_exemption.entity_id

GO

