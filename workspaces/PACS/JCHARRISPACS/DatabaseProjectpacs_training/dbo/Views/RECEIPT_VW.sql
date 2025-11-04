CREATE VIEW dbo.RECEIPT_VW
AS
SELECT TOP 0 property_val.prop_id, property_val.sup_num, 
    property_val.prop_val_yr, property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.appraised_val, 
    property_val.assessed_val, property_val.market, 
    property_val.ag_use_val, property_val.ag_market, 
    property_val.ag_loss, property_val.ag_late_loss, 
    property_val.timber_78, property_val.timber_market, 
    property_val.timber_use, property_val.timber_loss, 
    property_val.timber_late_loss, property_val.legal_desc, 
    property_val.legal_desc_2, property_val.legal_acreage, 
    prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc.sup_num AS Expr1, 
    property_val.prop_inactive_dt, property.prop_type_cd, 
    property.geo_id
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.sup_num = prop_supp_assoc.sup_num AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr INNER
     JOIN
    property ON 
    prop_supp_assoc.prop_id = property.prop_id
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa
      WHERE psa.prop_id = property_val.prop_id))

GO

