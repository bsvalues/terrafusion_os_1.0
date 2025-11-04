

CREATE VIEW MassEntityUpdate_vw

AS

SELECT distinct
    property."prop_id",
    property_val."prop_val_yr",
    property."geo_id",
    account."file_as_name",
    property_val."legal_desc",
    dbo.fn_GetEntities(property.prop_id, property_val.prop_val_yr, property_val.sup_num) as entities
FROM
    { oj ((("property" property INNER JOIN "owner" owner ON
        property."prop_id" = owner."prop_id")
     INNER JOIN "prop_supp_assoc" prop_supp_assoc ON
        owner."prop_id" = prop_supp_assoc."prop_id" AND
    owner."owner_tax_yr" = prop_supp_assoc."owner_tax_yr")
     INNER JOIN "account" account ON
        owner."owner_id" = account."acct_id")
     INNER JOIN "property_val" property_val ON
        prop_supp_assoc."prop_id" = property_val."prop_id" AND
    prop_supp_assoc."owner_tax_yr" = property_val."prop_val_yr" AND
    prop_supp_assoc."sup_num" = property_val."sup_num"}

GO

