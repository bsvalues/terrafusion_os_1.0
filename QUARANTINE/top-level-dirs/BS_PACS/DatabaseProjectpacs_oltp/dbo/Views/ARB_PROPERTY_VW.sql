


CREATE VIEW dbo.ARB_PROPERTY_VW
AS
SELECT property_type.prop_type_desc, prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, property_val.legal_desc, 
    property_val.prop_inactive_dt, property.geo_id, 
    account.file_as_name
FROM account INNER JOIN
    owner ON account.acct_id = owner.owner_id INNER JOIN
    property_type INNER JOIN
    property ON 
    property_type.prop_type_cd = property.prop_type_cd INNER JOIN
    property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num ON 
    property.prop_id = prop_supp_assoc.prop_id ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num
WHERE (property_val.prop_inactive_dt IS NULL)

GO

