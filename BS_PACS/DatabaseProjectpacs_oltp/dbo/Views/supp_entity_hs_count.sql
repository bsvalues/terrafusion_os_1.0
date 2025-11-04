




CREATE VIEW dbo.supp_entity_hs_count
AS
SELECT entity_prop_assoc.entity_id, 
    COUNT(DISTINCT entity_prop_assoc.prop_id) AS prop_ct, 
    entity_prop_assoc.sup_num, entity_prop_assoc.tax_yr
FROM entity_prop_assoc INNER JOIN
    property_val ON 
    entity_prop_assoc.prop_id = property_val.prop_id AND 
    entity_prop_assoc.tax_yr = property_val.prop_val_yr AND 
    entity_prop_assoc.sup_num = property_val.sup_num AND 
    property_val.prop_inactive_dt IS NULL INNER JOIN
    property_exemption ON 
    property_val.prop_id = property_exemption.prop_id AND 
    property_val.prop_val_yr = property_exemption.exmpt_tax_yr AND
     property_val.sup_num = property_exemption.sup_num AND 
    property_exemption.exmpt_type_cd = 'HS'
GROUP BY entity_prop_assoc.entity_id, 
    entity_prop_assoc.sup_num, entity_prop_assoc.tax_yr

GO

