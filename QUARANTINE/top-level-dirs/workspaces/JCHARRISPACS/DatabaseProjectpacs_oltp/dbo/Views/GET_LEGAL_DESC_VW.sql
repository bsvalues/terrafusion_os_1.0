


CREATE VIEW dbo.GET_LEGAL_DESC_VW
AS
SELECT prop_supp_assoc.prop_id, property_val.legal_desc, 
    property.geo_id, property_val.legal_acreage
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num INNER JOIN
    property ON property_val.prop_id = property.prop_id
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa
      WHERE psa.prop_id = property_val.prop_id))

GO

