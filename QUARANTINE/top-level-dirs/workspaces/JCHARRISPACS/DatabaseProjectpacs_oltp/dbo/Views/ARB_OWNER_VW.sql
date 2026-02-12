
CREATE VIEW dbo.ARB_OWNER_VW
AS
SELECT property_type.prop_type_desc, account.file_as_name, 
    prop_supp_assoc.prop_id, prop_supp_assoc.owner_tax_yr, 
    property_val.legal_desc, property_val.prop_inactive_dt, 
    owner.owner_id, property.geo_id
FROM property_type INNER JOIN
    property ON 
    property_type.prop_type_cd = property.prop_type_cd INNER JOIN
    property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num ON 
    property.prop_id = prop_supp_assoc.prop_id INNER JOIN
    account INNER JOIN
    owner ON account.acct_id = owner.owner_id ON 
    property_val.sup_num = owner.sup_num AND 
    property_val.prop_id = owner.prop_id AND 
    property_val.prop_val_yr = owner.owner_tax_yr
--WHERE (property_val.prop_inactive_dt IS NULL)

GO

