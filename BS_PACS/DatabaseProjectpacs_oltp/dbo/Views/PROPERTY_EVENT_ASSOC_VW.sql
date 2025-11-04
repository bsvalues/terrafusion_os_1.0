








CREATE VIEW dbo.PROPERTY_EVENT_ASSOC_VW
AS
SELECT prop_event_assoc.event_id, prop_event_assoc.prop_id, 
    property_type.prop_type_desc, property_val.legal_desc
FROM prop_supp_assoc INNER JOIN
    prop_event_assoc ON 
    prop_supp_assoc.prop_id = prop_event_assoc.prop_id INNER JOIN
    property INNER JOIN
    property_val ON 
    property.prop_id = property_val.prop_id INNER JOIN
    property_type ON 
    property.prop_type_cd = property_type.prop_type_cd ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa
      WHERE psa.prop_id = property_val.prop_id))

GO

