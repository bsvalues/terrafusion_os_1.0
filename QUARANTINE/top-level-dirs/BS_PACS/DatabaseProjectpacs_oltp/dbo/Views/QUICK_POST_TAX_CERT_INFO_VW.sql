


CREATE VIEW dbo.QUICK_POST_TAX_CERT_INFO_VW
AS
SELECT account.file_as_name, owner.owner_id, 
    prop_supp_assoc.owner_tax_yr, property.geo_id, 
    property_val.legal_desc, prop_supp_assoc.prop_id, 
    property_type.prop_type_desc, property_val.vit_flag, 
    property.prop_type_cd
FROM property_val INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id INNER JOIN
    owner INNER JOIN
    prop_supp_assoc ON 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND 
    owner.sup_num = prop_supp_assoc.sup_num INNER JOIN
    account ON owner.owner_id = account.acct_id ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num INNER JOIN
    property_type ON 
    property.prop_type_cd = property_type.prop_type_cd
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa, pacs_system
      WHERE psa.prop_id = property_val.prop_id AND 
           owner_tax_yr <= pacs_system.tax_yr))

GO

