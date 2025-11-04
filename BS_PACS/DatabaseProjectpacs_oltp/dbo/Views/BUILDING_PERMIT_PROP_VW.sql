



CREATE VIEW dbo.BUILDING_PERMIT_PROP_VW
AS
SELECT prop_supp_assoc.owner_tax_yr, account.file_as_name, 
    prop_building_permit_assoc.prop_id, 
    prop_building_permit_assoc.bldg_permit_id
FROM prop_building_permit_assoc INNER JOIN
    prop_supp_assoc ON 
    prop_building_permit_assoc.prop_id = prop_supp_assoc.prop_id
     LEFT OUTER JOIN
    account INNER JOIN
    owner ON account.acct_id = owner.owner_id ON 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa
      WHERE psa.prop_id = prop_building_permit_assoc.prop_id))

GO

