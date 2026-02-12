
CREATE VIEW dbo.special_exemption_total_vw
AS
SELECT COUNT(property_special_entity_exemption.prop_id) 
    AS exmpt_count, 
    property_special_entity_exemption.exmpt_tax_yr, 
    property_special_entity_exemption.exmpt_type_cd, 
    property_special_entity_exemption.entity_id, 
    SUM(property_special_entity_exemption.exmpt_amt) 
    AS exmpt_amt
FROM prop_supp_assoc INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num INNER
     JOIN
    property_special_entity_exemption ON 
    entity_prop_assoc.prop_id = property_special_entity_exemption.prop_id
     AND 
    entity_prop_assoc.sup_num = property_special_entity_exemption.sup_num
     AND 
    entity_prop_assoc.tax_yr = property_special_entity_exemption.exmpt_tax_yr
     INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)
GROUP BY property_special_entity_exemption.exmpt_tax_yr, 
    property_special_entity_exemption.exmpt_type_cd, 
    property_special_entity_exemption.entity_id

GO

